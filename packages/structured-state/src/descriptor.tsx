// import { Constructable } from "vitest";

// class Structure<T extends Constructable, S> {
//   constructor(
//     private readonly klass: T,
//     private readonly construct: (simplified: S) => InstanceType<T>
//   ) {}
// }

// function structure<T extends Constructable, S>(opts: {
//   construct: (simplified: S) => InstanceType<T>;
//   class: T;
// }): Structure<T, S> {
//   return new Structure(opts.class, opts.construct);
// }
