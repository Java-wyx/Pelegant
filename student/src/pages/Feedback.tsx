
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { BlurContainer } from "@/components/ui/BlurContainer";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Feedback = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (feedback.trim().length < 10) {
      toast.error("Please provide more detailed feedback");
      return;
    }
    
    // In a real app, you would send this to your API
    toast.success("Feedback submitted successfully", {
      description: "Thank you for helping us improve!"
    });
    
    setFeedback("");
    
    // Redirect back after a short delay
    setTimeout(() => {
      navigate("/help-support");
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-background py-6 px-4 max-w-md mx-auto">
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="space-y-6"
      >
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate("/help-support")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Feedback</h1>
        </div>
        
        <Card className="p-4">
          <p className="mb-4 text-sm text-muted-foreground">
            We value your thoughts and suggestions. Please share your feedback with us to help improve our service.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                className="w-full p-3 border rounded-lg min-h-[150px] bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Share your thoughts, suggestions, or report an issue..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <span>Submit Feedback</span>
                <Send size={16} />
              </button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default Feedback;
