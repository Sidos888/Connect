import { Suspense } from "react";
import GroupMembersClient from "./GroupMembersClient";

export default function GroupMembersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GroupMembersClient />
    </Suspense>
  );
}
