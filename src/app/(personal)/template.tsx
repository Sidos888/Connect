import Guard from "./guard";

export default function Template({ children }: { children: React.ReactNode }) {
  return <Guard>{children}</Guard>;
}


