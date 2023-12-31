import { Collection, MongoClient, ObjectId } from "mongodb";
import { AggregateRoot, Identifier } from "@juandardilag/value-objects";
import {
  ItemNotFoundException,
  Repository,
} from "@juandardilag/ddd-domain-layer";

export abstract class MongoRepository<T extends AggregateRoot>
  implements Repository<T>
{
  constructor(private _client: Promise<MongoClient>, protected _example: T) {}

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

  async getBy(key: string, value: string): Promise<T> {
    const collection = await this.collection();
    const document = await collection.findOne({ [key]: value });
    if (!document) {
      throw new ItemNotFoundException(
        this._example.constructor.name,
        key,
        value
      );
    }
    return this._example.fromPrimitives(document) as T;
  }

  async getByDocID(id: Identifier<string>): Promise<T> {
    const collection = await this.collection();
    const document = await collection.findOne({
      _id: ObjectId.createFromBase64(id.valueOf()),
    });
    if (!document) {
      throw new ItemNotFoundException(
        this._example.constructor.name,
        "id",
        id.valueOf()
      );
    }
    return this._example.fromPrimitives(document) as T;
  }

  async get(id: Identifier<string>): Promise<T> {
    return this.getBy("id", id.valueOf());
  }

  async persist(item: T): Promise<void> {
    const collection = await this.collection();
    const document = {
      ...item.toPrimitives(),
    };
    const res = await collection.insertOne(document);
    if (res.insertedId) {
      return;
    }
    throw new Error("error persisting in db");
  }

  async updateOne(item: T): Promise<void> {
    const collection = await this.collection();
    const document = {
      ...item.toPrimitives(),
    };
    delete document.id;

    const res = await collection.updateOne(
      { id: item.id.valueOf() },
      { $set: document },
      { upsert: false }
    );

    if (!res.matchedCount) {
      throw new ItemNotFoundException(
        item.constructor.name,
        "id",
        item.id.valueOf()
      );
    }
  }

  async deleteOne(id: Identifier<string>): Promise<void> {
    const collection = await this.collection();
    const res = await collection.deleteOne({
      id: id.valueOf(),
    });
    if (!res.deletedCount) {
      throw new ItemNotFoundException(
        this._example.constructor.name,
        "id",
        id.valueOf()
      );
    }
  }
}
