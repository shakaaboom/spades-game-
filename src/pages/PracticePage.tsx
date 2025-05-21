import { Layout } from "@/components/layout/Layout";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import PracticeRoom from "@/components/game/PracticeRoom";

export default function PracticePage() {
  const { session } = useAuth();
  return (
    <>
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="container mx-auto py-2 px-2 md:px-6 flex justify-between items-center">
          <Link to="/lobby">
            <Button variant="ghost" size="sm" className="h-8 md:h-9">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Back</span>
            </Button>
          </Link>
          <h4 className="text-lg font-bold">Practice Game</h4>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-7">
              <Clock className="h-3 w-3 mr-1" />
              <span className="text-xs">Practice Solo</span>
            </Badge>
          </div>
        </div>
      </div>
      <div className="container mx-auto py-2 px-2 md:px-6">
        <PracticeRoom session={session} />
      </div>
    </>
  );
}
