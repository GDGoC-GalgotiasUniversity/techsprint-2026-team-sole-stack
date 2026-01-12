// Dev migration page removed. Kept a minimal placeholder to avoid 404s during dev builds.
"use client";
import React from "react";

export default function DevMigrateRemoved() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Migration page removed</h1>
      <p className="text-sm text-neutral-600">The developer migration page has been removed. If you need to migrate local chat history to Supabase, please use your own migration script or reach out to the project maintainer.</p>
    </div>
  );
}
