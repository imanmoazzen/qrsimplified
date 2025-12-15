export const bigTestString =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(1000) +
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ".repeat(1000);

export const generateLargeJson = () => {
  const users = [];

  for (let i = 0; i < 5000; i++) {
    users.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      isActive: i % 2 === 0,
      createdAt: new Date().toISOString(),
      roles: ["user", ...(i % 10 === 0 ? ["admin"] : [])],
      profile: {
        bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        address: {
          street: `${i} Main St`,
          city: "Exampleville",
          state: "CA",
          zip: "12345",
        },
      },
    });
  }

  return { users };
};
