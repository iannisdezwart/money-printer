import { randomUUID } from "crypto";

export class ClientOrderIdGenerator {
  generate() {
    return randomUUID();
  }
}
