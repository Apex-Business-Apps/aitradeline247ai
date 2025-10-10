import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://cdn.skypack.dev/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LOAData {
  organizationId: string;
  variant: 'canada_local' | 'toll_free';
  fields: {
    effective_date?: string;
    legal_name: string;
    dba?: string;
    signer_name: string;
    signer_title: string;
    address_full?: string;
    signer_email: string;
    signer_phone: string;
    voice_carrier?: string;
    resporg?: string;
  };
  numbers: Array<{
    country: string;
    e164: string;
    type: string;
    voice_carrier: string;
    city_prov: string;
  }>;
  signature: {
    method: 'drawn' | 'typed';
    data: string; // Base64 PNG for drawn, text for typed
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const loaData: LOAData = await req.json();
    const { organizationId, variant, fields, numbers, signature } = loaData;

    // Load template mapping
    const mappingResponse = await fetch('https://raw.githubusercontent.com/yourusername/yourrepo/main/docs/ops/loa-template-map.json');
    const mapping = await mappingResponse.json();
    const variantConfig = mapping.variants[variant];

    // Check for custom template
    const { data: templateFile } = await supabase.storage
      .from('compliance')
      .download(`loa/templates/${organizationId}/master.pdf`);

    let pdfDoc: any;
    
    if (templateFile) {
      // Use custom PDF template
      const arrayBuffer = await templateFile.arrayBuffer();
      pdfDoc = await PDFDocument.load(arrayBuffer);
    } else {
      // Fallback: Create blank PDF
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]); // Letter size
      page.drawText('Letter of Authorization', {
        x: 50,
        y: 750,
        size: 20,
        color: rgb(0, 0, 0),
      });
    }

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = mapping.font.size;

    // Draw text fields at mapped coordinates
    Object.entries(variantConfig.fields).forEach(([fieldKey, coords]: [string, any]) => {
      const value = fields[fieldKey as keyof typeof fields];
      if (value) {
        firstPage.drawText(String(value), {
          x: coords.x,
          y: 792 - coords.y, // PDF coordinates are from bottom-left
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }
    });

    // Draw numbers table
    const tableAnchor = variantConfig.numbers_table_anchor;
    let yOffset = 792 - tableAnchor.y;
    
    firstPage.drawText('Country | E.164 | Type | Voice Carrier | City/Prov', {
      x: tableAnchor.x,
      y: yOffset,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    yOffset -= 15;
    numbers.forEach((num) => {
      const row = `${num.country} | ${num.e164} | ${num.type} | ${num.voice_carrier} | ${num.city_prov}`;
      firstPage.drawText(row, {
        x: tableAnchor.x,
        y: yOffset,
        size: 9,
        font,
        color: rgb(0, 0, 0),
      });
      yOffset -= 12;
    });

    // Draw signature
    const sigConfig = variantConfig.signature;
    if (signature.method === 'drawn') {
      // Decode base64 PNG and embed
      const base64Data = signature.data.split(',')[1];
      const pngImageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(pngImageBytes);
      
      firstPage.drawImage(pngImage, {
        x: sigConfig.x,
        y: 792 - sigConfig.y - sigConfig.height,
        width: sigConfig.width,
        height: sigConfig.height,
      });
    } else {
      // Typed signature
      const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      firstPage.drawText(signature.data, {
        x: sigConfig.x + 10,
        y: 792 - sigConfig.y - 40,
        size: 18,
        font: italicFont,
        color: rgb(0, 0, 0),
      });
    }

    // Add signature block text
    const signBlock = variantConfig.sign_block;
    firstPage.drawText(`${fields.signer_name}, ${fields.signer_title}`, {
      x: signBlock.name_title_x,
      y: 792 - signBlock.name_title_y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    firstPage.drawText(`Date: ${fields.effective_date || new Date().toISOString().split('T')[0]}`, {
      x: signBlock.date_x,
      y: 792 - signBlock.date_y,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });

    // Add Certificate page
    const certPage = pdfDoc.addPage([612, 792]);
    certPage.drawText('Certificate of Execution', {
      x: 50,
      y: 750,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
    
    const certText = [
      `Organization ID: ${organizationId}`,
      `Signed at: ${new Date().toISOString()}`,
      `Signature method: ${signature.method}`,
      `Numbers count: ${numbers.length}`,
      `Document variant: ${variant}`,
    ];
    
    let certY = 700;
    certText.forEach(line => {
      certPage.drawText(line, { x: 50, y: certY, size: 11, font, color: rgb(0, 0, 0) });
      certY -= 20;
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const nonce = crypto.randomUUID().split('-')[0];
    const date = new Date().toISOString().split('T')[0];
    const storagePath = `loa/${organizationId}/${date}/${nonce}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('compliance')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get signed URL (24hr expiry)
    const { data: urlData } = await supabase.storage
      .from('compliance')
      .createSignedUrl(storagePath, 86400);

    // Log to analytics
    await supabase.from('analytics_events').insert({
      event_type: 'loa_generated',
      event_data: {
        organization_id: organizationId,
        variant,
        numbers_count: numbers.length,
        signature_method: signature.method,
        has_custom_template: !!templateFile,
        storage_path: storagePath
      },
      severity: 'info'
    });

    return new Response(JSON.stringify({
      success: true,
      signed_url: urlData?.signedUrl,
      loa_id: nonce,
      storage_path: storagePath
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in ops-generate-loa:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
