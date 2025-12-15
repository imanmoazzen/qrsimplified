export const sortByCreationTime = (array, isDescending = false) => {
  array.sort((a, b) => {
    const x = a.creation_time ? new Date(a.creation_time).getTime() : 0;
    const y = b.creation_time ? new Date(b.creation_time).getTime() : 0;
    return x < y ? -1 : x > y ? 1 : 0;
  });

  if (isDescending) array.reverse();
  return array;
};

export const sortByUserId = (array, user_id) => {
  array?.sort((a, b) => {
    if (a.user_id === user_id) return -1;
    if (b.user_id === user_id) return 1;
    return 0;
  });
};
