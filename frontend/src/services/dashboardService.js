import { getAppDataSource } from "../lib/appClient";
import { readCollection, updateCollectionRow, writeCollection } from "../lib/mockDb";
import {
  adminInquiryRows,
  adminTasks,
  auditLogRows,
  reservationRows,
  sellerLodgings,
  sellerMetrics,
  sellerRows,
  sellerTasks,
  userRows,
} from "../data/dashboardData";
import {
  adminEventRows,
  adminReviewRows,
  sellerApplicationStatus,
  sellerApplicationSteps,
  sellerImageRows,
  sellerRoomRows,
} from "../data/opsData";
import { getSellerInquiryMessages, getSellerInquiryRooms } from "./sellerInquiryService";

const COLLECTION_KEYS = {
  adminUsers: "tripzone-admin-users",
  adminSellers: "tripzone-admin-sellers",
  adminEvents: "tripzone-admin-events",
  adminInquiries: "tripzone-admin-inquiries",
  adminReviews: "tripzone-admin-reviews",
  sellerLodgings: "tripzone-seller-lodgings",
  sellerReservations: "tripzone-seller-reservations",
  sellerRooms: "tripzone-seller-rooms",
  sellerAssets: "tripzone-seller-assets",
  sellerApplication: "tripzone-seller-application",
};

export function getDashboardDataSource() {
  return getAppDataSource();
}

export function getAdminTasks() {
  return adminTasks;
}

export function getSellerTasks() {
  return sellerTasks;
}

export function getAdminUsers() {
  return readCollection(COLLECTION_KEYS.adminUsers, userRows);
}

export function updateAdminUserStatus(email, nextStatus) {
  return updateCollectionRow(COLLECTION_KEYS.adminUsers, userRows, (row) => row.email === email, { status: nextStatus });
}

export function getAdminSellers() {
  return readCollection(COLLECTION_KEYS.adminSellers, sellerRows);
}

export function updateAdminSellerStatus(business, nextStatus) {
  return updateCollectionRow(
    COLLECTION_KEYS.adminSellers,
    sellerRows,
    (row) => row.business === business,
    { status: nextStatus },
  );
}

export function getAdminEvents() {
  return readCollection(COLLECTION_KEYS.adminEvents, adminEventRows);
}

export function updateAdminEventStatus(title, nextStatus) {
  return updateCollectionRow(
    COLLECTION_KEYS.adminEvents,
    adminEventRows,
    (row) => row.title === title,
    { status: nextStatus },
  );
}

export function saveAdminEvent(title, draft) {
  return updateCollectionRow(COLLECTION_KEYS.adminEvents, adminEventRows, (row) => row.title === title, draft);
}

export function getAdminInquiries() {
  return readCollection(COLLECTION_KEYS.adminInquiries, adminInquiryRows);
}

export function updateAdminInquiryStatus(id, nextStatus) {
  return updateCollectionRow(
    COLLECTION_KEYS.adminInquiries,
    adminInquiryRows,
    (row) => row.id === id,
    { status: nextStatus },
  );
}

export function getAdminReviews() {
  return readCollection(COLLECTION_KEYS.adminReviews, adminReviewRows);
}

export function updateAdminReviewStatus(reviewKey, nextStatus) {
  return updateCollectionRow(
    COLLECTION_KEYS.adminReviews,
    adminReviewRows,
    (row) => `${row.lodging}-${row.author}` === reviewKey,
    { status: nextStatus },
  );
}

export function getAdminAuditLogs() {
  return auditLogRows;
}

export function getSellerLodgings() {
  return readCollection(COLLECTION_KEYS.sellerLodgings, sellerLodgings);
}

export function updateSellerLodgingStatus(id, nextStatus) {
  return updateCollectionRow(COLLECTION_KEYS.sellerLodgings, sellerLodgings, (row) => row.id === id, { status: nextStatus });
}

export function getSellerReservations() {
  return readCollection(COLLECTION_KEYS.sellerReservations, reservationRows);
}

export function updateSellerReservationStatus(no, nextStatus) {
  return updateCollectionRow(
    COLLECTION_KEYS.sellerReservations,
    reservationRows,
    (row) => row.no === no,
    { status: nextStatus },
  );
}

export function getSellerRooms() {
  return readCollection(COLLECTION_KEYS.sellerRooms, sellerRoomRows);
}

export function updateSellerRoomStatus(rowKey, nextStatus) {
  return updateCollectionRow(
    COLLECTION_KEYS.sellerRooms,
    sellerRoomRows,
    (row) => `${row.lodging}-${row.name}` === rowKey,
    { status: nextStatus },
  );
}

export function getSellerAssets() {
  return readCollection(COLLECTION_KEYS.sellerAssets, sellerImageRows);
}

export function updateSellerAsset(rowKey, patch) {
  return updateCollectionRow(
    COLLECTION_KEYS.sellerAssets,
    sellerImageRows,
    (row) => `${row.lodging}-${row.type}` === rowKey,
    patch,
  );
}

export function getSellerApplicationTemplate() {
  return sellerApplicationStatus;
}

export function getSellerApplicationSteps() {
  return sellerApplicationSteps;
}

export function getSellerApplicationDraft() {
  return (
    readCollection(COLLECTION_KEYS.sellerApplication, [
      {
        status: "PENDING",
        businessNo: "",
        businessName: "",
        owner: "",
        account: "",
        submittedAt: null,
      },
    ])[0] ?? null
  );
}

export function submitSellerApplication(form) {
  const nextRow = {
    status: "PENDING",
    submittedAt: new Date().toISOString(),
    ...form,
  };
  writeCollection(COLLECTION_KEYS.sellerApplication, [nextRow]);
  return nextRow;
}

export function getSellerMetrics() {
  return sellerMetrics;
}

export function getAdminDashboardSnapshot() {
  return {
    adminTasks,
    adminInquiries: getAdminInquiries(),
    auditLogs: getAdminAuditLogs(),
    sellers: getAdminSellers(),
    users: getAdminUsers(),
  };
}

export function getSellerDashboardSnapshot() {
  return {
    sellerTasks,
    metrics: getSellerMetrics(),
    lodgings: getSellerLodgings(),
    reservations: getSellerReservations(),
    inquiries: [],
  };
}
