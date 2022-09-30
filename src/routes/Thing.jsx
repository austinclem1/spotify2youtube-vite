import { useLoaderData } from "react-router-dom";

export async function loader() {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 2000);
  }).then(() => ({
    stuff: 5,
  }));
}

export default function Thing() {
  const data = useLoaderData();

  return (
    <div>
      {data && (
        <div>{data.stuff}</div>
      )}
      <p>how are ya</p>
    </div>
  );
}
