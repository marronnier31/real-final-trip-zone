import {
  DISCOUNT_OPTIONS,
  FACILITY_GROUPS,
  GRADE_OPTIONS,
  LODGING_FEATURE_OPTIONS,
  LODGING_TYPE_OPTIONS,
  PRICE_BAND_OPTIONS,
  REGION_FILTER_OPTIONS,
  TASTE_OPTIONS,
} from "./lodgingListConstants";
import {
  getLodgingMeta,
  getLodgingTypeKey,
  hasFeature,
  isAvailableLodging,
  matchesKeyword,
  matchesPriceBand,
  matchesSuggestionKeyword,
  matchesTheme,
  queryNumber,
  scoreSuggestion,
  toPriceNumber,
} from "./lodgingListUtils";

export function parseLodgingSearchState(searchParams, defaults) {
  return {
    keyword: searchParams.get("keyword") ?? defaults.keyword,
    checkIn: searchParams.get("checkIn") ?? defaults.checkIn,
    checkOut: searchParams.get("checkOut") ?? defaults.checkOut,
    guests: searchParams.get("guests") ?? defaults.guests,
    theme: searchParams.get("theme") ?? "all",
    sort: searchParams.get("sort") ?? "recommended",
    region: searchParams.get("region") ?? "",
    type: searchParams.get("type") ?? "all",
    priceBand: searchParams.get("priceBand") ?? "all",
    regionFilter: searchParams.get("regionFilter") ?? "all",
    features: (searchParams.get("features") ?? "").split(",").filter(Boolean),
    tastes: (searchParams.get("tastes") ?? "").split(",").filter(Boolean),
    discounts: (searchParams.get("discounts") ?? "").split(",").filter(Boolean),
    grades: (searchParams.get("grades") ?? "").split(",").filter(Boolean),
    facilities: (searchParams.get("facilities") ?? "").split(",").filter(Boolean),
    minPrice: queryNumber(searchParams.get("minPrice"), 0),
    maxPrice: queryNumber(searchParams.get("maxPrice"), 100000000),
    availableOnly: searchParams.get("available") === "1",
  };
}

export function buildSuggestionItems(lodgings, searchSuggestionItems) {
  const lodgingItems = lodgings.flatMap((lodging) => [
    {
      label: lodging.name,
      subtitle: `${lodging.type}, ${lodging.region} ${lodging.district}`,
      type: "hotel",
      region: lodging.region,
      aliases: [lodging.district, lodging.address, ...lodging.highlights],
    },
    {
      label: lodging.district,
      subtitle: `${lodging.region} ${lodging.district}`,
      type: "region",
      region: lodging.region,
      aliases: [lodging.name, lodging.address],
    },
    {
      label: lodging.region,
      subtitle: `${lodging.region} 인기 숙소`,
      type: "region",
      region: lodging.region,
      aliases: [lodging.district, lodging.name],
    },
    ...searchSuggestionItems,
  ]);

  const unique = new Map();
  lodgingItems.forEach((item) => {
    const key = `${item.type}-${item.label}-${item.subtitle}`;
    if (!unique.has(key)) unique.set(key, item);
  });
  return Array.from(unique.values());
}

export function filterSuggestions(items, keyword) {
  if (!keyword.trim()) return [];
  return items
    .filter((item) => matchesSuggestionKeyword(item, keyword))
    .map((item) => ({ item, score: scoreSuggestion(item, keyword) }))
    .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label, "ko"))
    .map(({ item }) => item)
    .slice(0, 8);
}

export function buildOptionCounts(lodgings) {
  const countBy = (options, matcher) =>
    options.map((option) => ({
      ...option,
      count: option.value === "all" ? lodgings.length : lodgings.filter((lodging) => matcher(lodging, option.value)).length,
    }));

  return {
    types: countBy(LODGING_TYPE_OPTIONS, (lodging, value) => getLodgingTypeKey(lodging) === value),
    priceBands: countBy(PRICE_BAND_OPTIONS, (lodging, value) => matchesPriceBand(lodging, value)),
    regions: countBy(REGION_FILTER_OPTIONS, (lodging, value) => lodging.region.includes(value)),
    features: countBy(LODGING_FEATURE_OPTIONS, (lodging, value) => hasFeature(lodging, value)),
    tastes: countBy(TASTE_OPTIONS, (lodging, value) => getLodgingMeta(lodging).tastes.includes(value)),
    discounts: countBy(DISCOUNT_OPTIONS, (lodging, value) => getLodgingMeta(lodging).discounts.includes(value)),
    grades: countBy(GRADE_OPTIONS, (lodging, value) => getLodgingMeta(lodging).grades.includes(value)),
    facilities: FACILITY_GROUPS.map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        count: lodgings.filter((lodging) => getLodgingMeta(lodging).facilities.includes(option.value)).length,
      })),
    })),
  };
}

export function filterLodgings(lodgings, filters) {
  const results = lodgings.filter((lodging) => {
    const meta = getLodgingMeta(lodging);
    const priceValue = toPriceNumber(lodging.price);
    const regionMatch = filters.region ? lodging.region.includes(filters.region) : true;
    const regionFilterMatch = filters.regionFilter === "all" ? true : lodging.region.includes(filters.regionFilter);
    const typeMatch = filters.type === "all" ? true : getLodgingTypeKey(lodging) === filters.type;
    const priceBandMatch =
      matchesPriceBand(lodging, filters.priceBand) && priceValue >= filters.minPrice && priceValue <= filters.maxPrice;
    const featureMatch = filters.features.every((featureItem) => hasFeature(lodging, featureItem));
    const tasteMatch = filters.tastes.every((value) => meta.tastes.includes(value));
    const discountMatch = filters.discounts.every((value) => meta.discounts.includes(value));
    const gradeMatch = filters.grades.every((value) => meta.grades.includes(value));
    const facilityMatch = filters.facilities.every((value) => meta.facilities.includes(value));
    const availableMatch = filters.availableOnly ? isAvailableLodging(lodging) : true;

    return (
      regionMatch &&
      regionFilterMatch &&
      typeMatch &&
      priceBandMatch &&
      featureMatch &&
      tasteMatch &&
      discountMatch &&
      gradeMatch &&
      facilityMatch &&
      availableMatch &&
      matchesKeyword(lodging, filters.keyword) &&
      matchesTheme(lodging, filters.theme)
    );
  });

  if (filters.sort === "ranking") {
    return [...results].sort((left, right) => Number(right.rating) * 100 + reviewCountNumber(right.reviewCount) - (Number(left.rating) * 100 + reviewCountNumber(left.reviewCount)));
  }
  if (filters.sort === "rating") return [...results].sort((left, right) => Number(right.rating) - Number(left.rating));
  if (filters.sort === "reviews") return [...results].sort((left, right) => reviewCountNumber(right.reviewCount) - reviewCountNumber(left.reviewCount));
  if (filters.sort === "price_low") return [...results].sort((left, right) => toPriceNumber(left.price) - toPriceNumber(right.price));
  if (filters.sort === "price_high") return [...results].sort((left, right) => toPriceNumber(right.price) - toPriceNumber(left.price));
  return results;
}

export function buildFilterSummary(filters, sortOptions) {
  return [
    filters.type !== "all" ? LODGING_TYPE_OPTIONS.find((item) => item.value === filters.type)?.label : null,
    filters.priceBand !== "all" ? PRICE_BAND_OPTIONS.find((item) => item.value === filters.priceBand)?.label : null,
    filters.regionFilter !== "all" ? REGION_FILTER_OPTIONS.find((item) => item.value === filters.regionFilter)?.label : null,
    ...filters.features.map((value) => LODGING_FEATURE_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    ...filters.tastes.map((value) => TASTE_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    ...filters.discounts.map((value) => DISCOUNT_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    ...filters.grades.map((value) => GRADE_OPTIONS.find((item) => item.value === value)?.label).filter(Boolean),
    filters.availableOnly ? "매진 제외" : null,
  ].filter(Boolean);
}

function reviewCountNumber(value) {
  return Number(String(value ?? "").replace(/[^\d]/g, ""));
}
