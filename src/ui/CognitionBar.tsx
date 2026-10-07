import type { ComponentProps } from "react";
import { TaskCalendarCommandBar } from "../components/global/TaskCalendarCommandBar";

const CognitionBar = (props: ComponentProps<typeof TaskCalendarCommandBar>) => {
  return <TaskCalendarCommandBar {...props} />;
};

export default CognitionBar;
