import { get } from "../lib/appClient";

export async function geocodeAddress(address) {
  const query = String(address ?? "").trim();
  if (!query) {
    throw new Error("주소가 비어 있어 좌표를 찾을 수 없습니다.");
  }

  const response = await get(
    `/api/maps/geocode?address=${encodeURIComponent(query)}`,
  );

  return {
    latitude: Number(response.latitude),
    longitude: Number(response.longitude),
  };
}
