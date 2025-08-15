"use client";

import { useState } from "react";
import { demoClient } from "@/api-clients/demo-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ApiDemoButtons() {
  const [loading, setLoading] = useState({
    hello: false,
    error: false,
  });

  const handleHelloClick = async () => {
    setLoading({ ...loading, hello: true });
    try {
      const response = await demoClient.hello();

      if (response.success && response.data) {
        // Show response data in the toast
        toast.success("API call successful", {
          description: response.data.message,
        });
      } else {
        // Handle error toast in the component
        toast.error("API call failed", {
          description: response.error?.message || "Unknown error occurred",
        });
      }
    } finally {
      setLoading({ ...loading, hello: false });
    }
  };

  const handleErrorClick = async () => {
    setLoading({ ...loading, error: true });
    try {
      const response = await demoClient.triggerError();

      // This will always fail as the endpoint is designed to return an error
      if (!response.success) {
        toast.error("Error example", {
          description: response.error?.message || "Unknown error occurred",
        });
      }
    } finally {
      setLoading({ ...loading, error: false });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handleHelloClick}
          disabled={loading.hello}
          variant="default"
        >
          {loading.hello ? "Loading..." : "Call Success API"}
        </Button>

        <Button
          onClick={handleErrorClick}
          disabled={loading.error}
          variant="destructive"
        >
          {loading.error ? "Loading..." : "Call Error API"}
        </Button>
      </div>
    </div>
  );
}
