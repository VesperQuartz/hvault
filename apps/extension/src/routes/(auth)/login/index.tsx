import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/login/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className="text-center">Hello "/(auth)/login/"!</div>;
}
