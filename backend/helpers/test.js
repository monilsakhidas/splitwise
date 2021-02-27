"use strict";

const _ = require("lodash");

const array = [
  {
    id: 1,
    amount: -250,
    createdAt: "2021-02-26T09:08:48.000Z",
    updatedAt: "2021-02-26T09:08:48.000Z",
    currencyId: 1,
    userId1: 2,
    userId2: 6,
    groupId: 2,
    currency: {
      id: 1,
      symbol: "$",
    },
    user: {
      id: 2,
      name: "Bhide",
    },
    group: {
      id: 2,
      name: "Test",
    },
  },
  {
    id: 2,
    amount: -250,
    createdAt: "2021-02-26T09:08:49.000Z",
    updatedAt: "2021-02-26T09:08:49.000Z",
    currencyId: 1,
    userId1: 5,
    userId2: 6,
    groupId: 2,
    currency: {
      id: 1,
      symbol: "$",
    },
    user: {
      id: 5,
      name: "Jetha",
    },
    group: {
      id: 2,
      name: "Test",
    },
  },
  {
    id: 3,
    amount: -250,
    createdAt: "2021-02-26T09:08:49.000Z",
    updatedAt: "2021-02-26T09:08:49.000Z",
    currencyId: 1,
    userId1: 4,
    userId2: 6,
    groupId: 2,
    currency: {
      id: 1,
      symbol: "$",
    },
    user: {
      id: 4,
      name: "Popat",
    },
    group: {
      id: 2,
      name: "Test",
    },
  },
  {
    id: 4,
    amount: -250,
    createdAt: "2021-02-26T09:17:02.000Z",
    updatedAt: "2021-02-26T09:17:02.000Z",
    currencyId: 2,
    userId1: 2,
    userId2: 6,
    groupId: 2,
    currency: {
      id: 2,
      symbol: "€",
    },
    user: {
      id: 2,
      name: "Bhide",
    },
    group: {
      id: 2,
      name: "Test",
    },
  },
  {
    id: 5,
    amount: -250,
    createdAt: "2021-02-26T09:17:02.000Z",
    updatedAt: "2021-02-26T09:17:02.000Z",
    currencyId: 2,
    userId1: 5,
    userId2: 6,
    groupId: 2,
    currency: {
      id: 2,
      symbol: "€",
    },
    user: {
      id: 5,
      name: "Jetha",
    },
    group: {
      id: 2,
      name: "Test",
    },
  },
  {
    id: 6,
    amount: -250,
    createdAt: "2021-02-26T09:17:02.000Z",
    updatedAt: "2021-02-26T09:17:02.000Z",
    currencyId: 2,
    userId1: 4,
    userId2: 6,
    groupId: 2,
    currency: {
      id: 2,
      symbol: "€",
    },
    user: {
      id: 4,
      name: "Popat",
    },
    group: {
      id: 2,
      name: "Test",
    },
  },
];

const groupedByUser = _.chain(array)
  .groupBy((b) => {
    return b.user.id;
  })
  .value();

for (let userId in groupedByUser) {
  const groupedByUserByCurrency = _.chain(groupedByUser[userId])
    .groupBy((b) => {
      return b.currency.id;
    })
    .value();
  console.log(userId.toUpperCase());
  console.log(groupedByUserByCurrency);
}
