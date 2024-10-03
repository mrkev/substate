import {
  unstable_cancelCallback,
  unstable_NormalPriority,
  unstable_scheduleCallback,
} from "scheduler";

export function SchedulerTest() {
  return (
    <button
      onClick={async () => {
        const one = unstable_scheduleCallback(
          unstable_NormalPriority,
          function callbackFoo() {
            console.log("one");
          }
        );

        const pr = new Promise<void>((res) => {
          try {
            unstable_scheduleCallback(
              unstable_NormalPriority,
              function callbackFoo() {
                performance.mark("two");
                console.log("two");
                res();
              }
            );
          } catch (e) {
            console.log("FO");
            console.error(e);
          }
        });

        unstable_scheduleCallback(
          unstable_NormalPriority,
          function callbackFoo() {
            performance.mark("three");
            console.log("three");
          }
        );

        unstable_cancelCallback(one);

        await pr;
        performance.mark("two done");
        console.log("two done");
      }}
    >
      test
    </button>
  );
}
