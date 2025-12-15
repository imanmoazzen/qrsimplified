export class NoUserFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NoUserFoundError";
  }
}

export class MultipleUsersFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "MultipleUsersFoundError";
  }
}
