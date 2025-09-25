-- TASK 5: Helpers (idempotent functions)
-- Refresh materialized wallet balance (use after posting)
CREATE OR REPLACE FUNCTION public.refresh_wallet_balances() 
RETURNS void 
LANGUAGE sql 
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.wallet_balances;
$$;

-- Post a wallet entry (idempotent on key)
CREATE OR REPLACE FUNCTION public.post_wallet_entry(
  p_org_id uuid,
  p_type public.ledger_entry_type,
  p_amount_cents bigint,
  p_related_type text,
  p_related_id uuid,
  p_idempotency_key text,
  p_memo text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  -- if idem key exists, return existing
  SELECT id INTO v_id FROM public.wallet_ledger WHERE idempotency_key = p_idempotency_key;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.wallet_ledger(org_id,entry_type,amount_cents,related_type,related_id,idempotency_key,memo)
  VALUES (p_org_id,p_type,p_amount_cents,p_related_type,p_related_id,p_idempotency_key,p_memo)
  RETURNING id INTO v_id;

  PERFORM public.refresh_wallet_balances();
  RETURN v_id;
END $$;

-- Charge commission (debit wallet) + record commission_charges, idempotent
CREATE OR REPLACE FUNCTION public.charge_commission(
  p_org_id uuid,
  p_amount_cents bigint,           -- e.g., 14900
  p_call_id uuid,
  p_call_sid text,
  p_rules jsonb,
  p_idempotency_key text
) RETURNS uuid
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE v_charge_id uuid; v_ledger_id uuid; v_balance bigint;
BEGIN
  -- idempotency on commission_charges
  SELECT id INTO v_charge_id FROM public.commission_charges WHERE idempotency_key = p_idempotency_key;
  IF v_charge_id IS NOT NULL THEN RETURN v_charge_id; END IF;

  -- ensure sufficient balance (business rule, can be relaxed)
  SELECT balance_cents INTO v_balance FROM public.wallet_balances WHERE org_id = p_org_id;
  IF COALESCE(v_balance,0) < p_amount_cents THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- post debit to wallet (negative amount)
  v_ledger_id := public.post_wallet_entry(
    p_org_id, 'capture', -p_amount_cents, 'call', p_call_id, p_idempotency_key,
    'Commission charge for qualified appointment'
  );

  INSERT INTO public.commission_charges(org_id, call_id, call_sid, qualified, rules_snapshot, amount_cents, ledger_entry_id, idempotency_key)
  VALUES (p_org_id, p_call_id, p_call_sid, true, COALESCE(p_rules,'{}'::jsonb), p_amount_cents, v_ledger_id, p_idempotency_key)
  RETURNING id INTO v_charge_id;

  RETURN v_charge_id;
END $$;

-- Top up wallet (credit), idempotent
CREATE OR REPLACE FUNCTION public.wallet_top_up(
  p_org_id uuid,
  p_amount_cents bigint,
  p_provider text,
  p_provider_id text,
  p_idempotency_key text
) RETURNS uuid
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE v_intent_id uuid; v_ledger_id uuid;
BEGIN
  -- idempotency on payment_intents
  SELECT id INTO v_intent_id FROM public.payment_intents WHERE idempotency_key = p_idempotency_key;
  IF v_intent_id IS NULL THEN
    INSERT INTO public.payment_intents(org_id,intent_type,amount_cents,provider,provider_id,status,idempotency_key)
    VALUES (p_org_id,'wallet_top_up',p_amount_cents,p_provider,p_provider_id,'succeeded',p_idempotency_key)
    RETURNING id INTO v_intent_id;
  END IF;

  v_ledger_id := public.post_wallet_entry(
    p_org_id,'top_up', p_amount_cents,'payment_intent', v_intent_id, p_idempotency_key,
    'Wallet top-up'
  );
  RETURN v_intent_id;
END $$;

-- TASK 6: Minimum balance check (policy helper)
-- View to flag orgs below required minimum ($200)
CREATE OR REPLACE VIEW public.wallet_minimum_flags AS
SELECT
  b.org_id,
  b.balance_cents,
  (b.balance_cents < 20000)::boolean AS below_minimum
FROM public.wallet_balances b;

-- TASK 7: QA Output and completion message
SELECT 
  'TL247AI Finance Tables Implementation Complete' as status,
  'All tables created with RLS enabled' as security_status,
  'Helper functions implemented for wallet operations' as functions_status;