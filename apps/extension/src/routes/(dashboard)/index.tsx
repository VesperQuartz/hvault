import { Button } from "@hvault/ui/components/button";
import { Input } from "@hvault/ui/components/input";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(dashboard)/")({
  component: App,
});

function App() {
  return (
    <div className="p-4 text-center w-[500px] h-[700px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const data = Object.fromEntries(formData.entries());
          console.log(data);
        }}
      >
        <div className="flex flex-col gap-4">
          <Input
            type="text"
            name="name"
            placeholder="Name"
            className="w-fit border border-blue-500"
          />
          <Button type="submit" className={"w-fit cursor-pointer"}>
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
