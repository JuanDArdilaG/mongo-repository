import { AggregateRoot } from "@juandardilag/ddd-domain-layer";
import { IIdentifier } from "@juandardilag/value-objects";

export interface Repository<T extends AggregateRoot> {
  persist(aggregateRoot: T): Promise<void>;
  updateOne(aggregateRoot: T): Promise<void>;
  getAll(): Promise<T[]>;
  getByID(id: IIdentifier): Promise<T>;
}
