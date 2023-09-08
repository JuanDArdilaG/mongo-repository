import { Collection, MongoClient, ObjectId } from "mongodb";
import { Repository } from "./IMongoRepository";
import { AggregateRoot, IIdentifier } from "@juandardilag/value-objects";

export abstract class MongoRepository<T extends AggregateRoot>
  implements Repository<T>
{
  constructor(private _client: Promise<MongoClient>, private _example: T) {}

  protected abstract moduleName(): string;

  protected client(): Promise<MongoClient> {
    return this._client;
  }

  protected async collection(): Promise<Collection> {
    return (await this._client).db().collection(this.moduleName());
  }

  async getAll(): Promise<T[]> {
    const collection = await this.collection();
    return (await collection.find().toArray()).map((prim) => {
      return this._example.fromPrimitives(prim);
    }) as T[];
  }

  async getByID(id: IIdentifier<string>): Promise<T> {
    const collection = await this.collection();
    const document = await collection.findOne({
      _id: ObjectId.createFromBase64(id.valueOf()),
    });
    if (!document) {
      throw new Error(
        `${typeof this
          ._example} document with id ${id.valueOf()} doesn't exists.`
      );
    }
    return this._example.fromPrimitives(document) as T;
  }

  async persist(aggregateRoot: T): Promise<void> {
    const collection = await this.collection();
    const document = {
      ...aggregateRoot.toPrimitives(),
      _id: aggregateRoot.id.valueOf(),
    };
    delete document.id;
    const res = await collection.insertOne(document);
    if (res.insertedId) {
      return;
    }
    throw new Error("error persisting in db");
  }

  async updateOne(aggregateRoot: T): Promise<void> {
    const collection = await this.collection();
    const document = {
      ...aggregateRoot.toPrimitives(),
      _id: aggregateRoot.id.valueOf(),
    };
    delete document.id;

    await collection.updateOne(
      { _id: ObjectId.createFromBase64(aggregateRoot.id.valueOf()) },
      { $set: document },
      { upsert: false }
    );
  }
}
