import { ProgressProvider } from "@bprogress/react";

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ProgressProvider
      height="4px"
      color="#ff1E1E"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  );
};
