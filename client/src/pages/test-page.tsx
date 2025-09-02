import React from 'react';

export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a test page to verify routing.</p>
      <div className="mt-4">
        <a href="/" className="text-primary hover:underline">Go back home</a>
      </div>
    </div>
  );
}