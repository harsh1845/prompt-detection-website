"use client";

import { useRef } from "react";

export default function OrgSwitcher({
  orgs,
  activeOrgId,
  action,
}: {
  orgs: { id: string; name: string }[];
  activeOrgId: string;
  action: (formData: FormData) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={action} ref={formRef}>
      <select
        name="orgId"
        defaultValue={activeOrgId}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Switch workspace"
        className="rounded-sm border border-hairline bg-elevated px-2.5 py-1.5 font-body text-[13px] text-ink outline-none focus:border-signal/70"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </form>
  );
}
