
import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface SetupOptionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  content: string;
  buttonText: string;
  buttonIcon: LucideIcon;
  onClick: () => void;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export const SetupOptionCard: React.FC<SetupOptionCardProps> = ({
  icon: Icon,
  title,
  description,
  content,
  buttonText,
  buttonIcon: ButtonIcon,
  onClick,
  buttonVariant = "default"
}) => {
  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
    hover: { scale: 1.03, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
      <Card 
        className="cursor-pointer h-full hover:border-ios-primary transition-colors"
        onClick={onClick}
      >
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon className="mr-2 text-ios-primary h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{content}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant={buttonVariant}>
            <ButtonIcon className="mr-2 h-4 w-4" /> {buttonText}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
