import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Brain, Zap } from "lucide-react";
const steps = [{
  icon: Phone,
  step: "01",
  title: "Connect Your Channels",
  description: "Integrate your phone, email, SMS, WhatsApp, and other communication channels in minutes. Our AI instantly starts learning your business context."
}, {
  icon: Brain,
  step: "02",
  title: "AI Learns Your Business",
  description: "Our intelligent system analyzes your business information, FAQs, and preferences to create personalized responses that match your brand voice."
}, {
  icon: Zap,
  step: "03",
  title: "Growth is 24/7",
  description: "Your AI receptionist handles inquiries, books appointments, captures leads, and escalates when needed - all while you focus on growing your business."
}];
export const HowItWorks = () => {
  return <section className="py-20 bg-gradient-to-br from-secondary/10 to-accent/5">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get your AI receptionist up and running in three simple steps
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => <Card key={index} className="relative text-center group hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                {step.step}
              </div>
              <CardHeader className="pt-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-[#1e556b]">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>)}
        </div>
      </div>
    </section>;
};