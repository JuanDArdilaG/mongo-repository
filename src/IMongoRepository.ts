import { AggregateRoot, IIdentifier } from "@juandardilag/value-objects";

export interface Repository<T extends AggregateRoot> {
  persist(aggregateRoot: T): Promise<void>;
  updateOne(aggregateRoot: T): Promise<void>;
  getAll(): Promise<T[]>;
  getByID(id: IIdentifier<string>): Promise<T>;
}
