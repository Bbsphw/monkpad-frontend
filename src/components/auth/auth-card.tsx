import { type ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";

type AuthIcon = "login" | "signup";
interface AuthCardProps {
  title: string;
  description?: string;
  icon?: AuthIcon;
  children: ReactNode;
}

const iconMap: Record<AuthIcon, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  signup: UserPlus,
};

export default function AuthCard({
  title,
  description,
  icon = "login",
  children,
}: AuthCardProps) {
  const IconComp = iconMap[icon] ?? LogIn;
  return (
    <Card className="w-full max-w-md shadow-strong">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
          <IconComp className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children}
    </Card>
  );
}
