import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLocalUser, signOutLocalUser } from "@/lib/local-auth";

export function UserMenu() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const user = getLocalUser();
    if (active && user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar);
    }
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    signOutLocalUser();
    navigate({ to: "/", replace: true });
  }

  const initials = name.trim().slice(0, 2).toUpperCase() || "U";
  const displayName = name || "ผู้ใช้งาน";
  const displayEmail = email || "เข้าสู่ระบบแล้ว";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sidebar-foreground shadow-sm transition-all hover:bg-white/15"
        >
          <span className="relative">
            <Avatar className="size-10 border-2 border-white/30 shadow-lg shadow-slate-950/20">
              {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-cyan-300 via-sky-500 to-indigo-600 text-sm font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-sidebar bg-emerald-400 shadow-sm" />
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block max-w-36 truncate text-sm font-semibold leading-tight">
              {displayName}
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-xs leading-tight text-emerald-200">
              <CheckCircle2 className="size-3" /> ออนไลน์
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <span className="relative">
              <Avatar className="size-12 border border-slate-200">
                {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
                <AvatarFallback className="bg-gradient-to-br from-cyan-300 via-sky-500 to-indigo-600 font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{displayName}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">
                {displayEmail}
              </div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="size-3" /> กำลังใช้งาน
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="rounded-xl">
          <LogOut className="mr-2 size-4" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
