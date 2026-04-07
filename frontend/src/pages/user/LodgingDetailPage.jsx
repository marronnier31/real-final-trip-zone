import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import StayMap from "../../components/common/StayMap";
import { readAuthSession } from "../../utils/authSession";
import { ReviewSection, RoomOptionsSection, StickyBookingCard } from "../../features/lodging-detail/LodgingDetailSections";
import {
  buildPropertyStory,
  buildRoomOptions,
  canWriteLodgingReview,
  getReviewAverage,
} from "../../features/lodging-detail/lodgingDetailViewModel";
import { buildGalleryImages, getRoomMeta } from "../../features/lodging-detail/lodgingDetailUtils";
import {
  createLodgingReview,
  deleteLodgingReview,
  getLodgingById,
  getLodgingDetailById,
  getLodgingReviews,
  updateLodgingReview,
  uploadLodgingReviewImages,
} from "../../services/lodgingService";
import { getApiBaseUrl } from "../../lib/appClient";
import { getMyBookings, getMyWishlist, toggleMyWishlist } from "../../services/mypageService";
import {
  findMyInquiryRoomByLodgingId,
  getSellerInquiryMessages,
  sendGuestInquiryMessage,
  subscribeSellerInquiryRoom,
} from "../../services/sellerInquiryService";

const sellerContactByLodging = {
  1: {
    name: "오션스테이 운영팀",
    badge: "평균 8분 내 응답",
    status: "실시간 응답 가능",
    messages: [],
  },
  2: {
    name: "제주 포레스트 하우스",
    badge: "평균 12분 내 응답",
    status: "실시간 응답 가능",
    messages: [],
  },
  3: {
    name: "강릉 코스트 라운지",
    badge: "평균 10분 내 응답",
    status: "실시간 응답 가능",
    messages: [],
  },
  4: {
    name: "서울 시티 모먼트",
    badge: "평균 6분 내 응답",
    status: "실시간 응답 가능",
    messages: [],
  },
  5: {
    name: "여수 선셋 마리나",
    badge: "평균 11분 내 응답",
    status: "실시간 응답 가능",
    messages: [],
  },
  6: {
    name: "경주 헤리티지 한옥",
    badge: "평균 9분 내 응답",
    status: "실시간 응답 가능",
    messages: [],
  },
};

export default function LodgingDetailPage() {
  const { lodgingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingDateSuffix = (() => {
    const parts = [];
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");
    if (checkIn) parts.push(`checkIn=${checkIn}`);
    if (checkOut) parts.push(`checkOut=${checkOut}`);
    if (guests) parts.push(`guests=${guests}`);
    return parts.length ? `?${parts.join("&")}` : "";
  })();
  const [lodging, setLodging] = useState(null);
  const [isLodgingLoading, setIsLodgingLoading] = useState(true);
  const [lodgingLoadError, setLodgingLoadError] = useState("");
  const [myBookingRows, setMyBookingRows] = useState([]);
  const roomOptions = useMemo(() => (lodging ? buildRoomOptions(lodging) : []), [lodging]);
  const propertyStory = useMemo(() => (lodging ? buildPropertyStory(lodging) : []), [lodging]);
  const galleryImages = useMemo(
    () => buildGalleryImages(lodging?.galleryImages?.length ? lodging.galleryImages : [lodging?.image].filter(Boolean)),
    [lodging?.galleryImages, lodging?.image],
  );
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [wishlisted, setWishlisted] = useState(false);
  const [isWishlistSaving, setIsWishlistSaving] = useState(false);
  const [shareLabel, setShareLabel] = useState("공유하기");
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [reviewDraft, setReviewDraft] = useState({ reviewId: null, bookingNo: null, score: 5, body: "", images: [] });
  const [reviews, setReviews] = useState([]);
  const [reviewImagePreviewMap, setReviewImagePreviewMap] = useState({});
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [isReviewUploading, setIsReviewUploading] = useState(false);
  const [reviewNotice, setReviewNotice] = useState("");
  const sellerContact = sellerContactByLodging[lodging?.id] ?? sellerContactByLodging[1];
  const [chatMessages, setChatMessages] = useState([]);
  const [inquiryRoomId, setInquiryRoomId] = useState(null);
  const [isInquiryLoading, setIsInquiryLoading] = useState(false);
  const reviewAverage = useMemo(() => getReviewAverage(reviews), [reviews]);
  const reviewCountLabel = useMemo(() => `${reviews.length}개`, [reviews.length]);
  const reviewSectionRef = useRef(null);
  const inquiryThreadRef = useRef(null);
  const inquiryUnsubscribeRef = useRef(() => {});
  const authSession = useMemo(() => readAuthSession(), []);
  const isCustomerSession = useMemo(() => {
    const roles = authSession?.roleNames ?? (authSession?.role ? [authSession.role] : []);
    return roles.includes("ROLE_USER");
  }, [authSession]);
  const myExistingReview = useMemo(
    () => reviews.find((item) => authSession?.userNo && Number(item.userNo) === Number(authSession.userNo)) ?? null,
    [authSession?.userNo, reviews],
  );
  const roomBaseMeta = getRoomMeta(selectedRoom?.name ?? "");
  const canWriteReview = useMemo(
    () => isCustomerSession && canWriteLodgingReview(authSession, myBookingRows, lodging?.id ?? 0),
    [authSession, isCustomerSession, lodging?.id, myBookingRows],
  );
  const completedReviewBookings = useMemo(
    () => myBookingRows.filter((booking) => booking.lodgingId === lodging?.id && booking.status === "COMPLETED"),
    [lodging?.id, myBookingRows],
  );
  const myVisibleReviewBookingNos = useMemo(
    () =>
      new Set(
        reviews
          .filter((item) => authSession?.userNo && Number(item.userNo) === Number(authSession.userNo))
          .map((item) => Number(item.bookingNo)),
      ),
    [authSession?.userNo, reviews],
  );

  const revokeReviewPreviewUrls = (images) => {
    images.forEach((image) => {
      if (!image?.isLocalPreview || !image.previewUrl || typeof window === "undefined") return;
      window.URL.revokeObjectURL(image.previewUrl);
    });
  };

  const revokeResolvedReviewImageUrls = (previewMap) => {
    Object.values(previewMap).forEach((previewUrl) => {
      if (typeof previewUrl === "string" && previewUrl.startsWith("blob:") && typeof window !== "undefined") {
        window.URL.revokeObjectURL(previewUrl);
      }
    });
  };

  const buildReviewDraftFromReview = (review) => ({
    reviewId: review.id,
    bookingNo: review.bookingNo,
    score: Number(review.score),
    body: review.body,
    images: (review.imageFileNames ?? []).map((fileName, index) => ({
      fileName,
      previewUrl: "",
    })),
  });

  const isDuplicateReviewErrorMessage = (message) =>
    message.includes("이미 해당 숙소에 대한 리뷰를 작성") ||
    message.includes("이미 해당 예약에 대한 리뷰가 존재") ||
    (message.includes("이미") && message.includes("리뷰"));

  const resolveProtectedReviewImageUrl = async (fileName, accessToken) => {
    if (!fileName || !accessToken || typeof window === "undefined") return null;
    const response = await fetch(`${getApiBaseUrl()}/api/view/${encodeURIComponent(fileName)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  };

  const loadLodgingWithTimeout = async (requestPromise, timeoutMessage) => {
    let timerId;

    try {
      return await Promise.race([
        requestPromise,
        new Promise((_, reject) => {
          timerId = window.setTimeout(() => reject(new Error(timeoutMessage)), 8000);
        }),
      ]);
    } finally {
      window.clearTimeout(timerId);
    }
  };

  const getChatBubbleTone = (sender) => {
    if (sender === "회원" || sender === "guest" || sender === "USER") return "guest";
    return "seller";
  };

  useEffect(() => {
    if (location.hash !== "#reviews") return;
    const timer = window.setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash]);

  useEffect(() => {
    let cancelled = false;

    async function loadLodging() {
      setIsLodgingLoading(true);
      setLodgingLoadError("");

      try {
        const nextLodging = await loadLodgingWithTimeout(
          getLodgingDetailById(lodgingId),
          "숙소 상세 응답이 지연되고 있습니다.",
        );
        if (cancelled) return;
        setLodging(nextLodging);
      } catch (error) {
        console.error("Failed to load lodging detail.", error);
        try {
          const fallbackLodging = await loadLodgingWithTimeout(
            getLodgingById(lodgingId),
            "숙소 기본 정보 응답도 지연되고 있습니다.",
          );
          if (cancelled) return;
          setLodging(fallbackLodging);
          setLodgingLoadError("일부 상세 정보가 지연되어 기본 숙소 정보만 먼저 표시합니다.");
        } catch (fallbackError) {
          if (cancelled) return;
          console.error("Failed to load fallback lodging detail.", fallbackError);
          setLodging(null);
          setLodgingLoadError("숙소 상세 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
      } finally {
        if (!cancelled) {
          setIsLodgingLoading(false);
        }
      }
    }

    loadLodging();

    return () => {
      cancelled = true;
    };
  }, [lodgingId]);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      try {
        setIsReviewLoading(true);
        const rows = await getLodgingReviews(lodgingId);
        if (cancelled) return;
        setReviews(rows);
        setReviewNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load lodging reviews.", error);
        setReviews([]);
        setReviewNotice("리뷰 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsReviewLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [lodgingId]);

  useEffect(() => {
    let cancelled = false;

    async function loadMyBookings() {
      if (!authSession?.accessToken || !isCustomerSession) {
        setMyBookingRows([]);
        return;
      }

      try {
        const rows = await getMyBookings();
        if (cancelled) return;
        setMyBookingRows(rows);
      } catch (error) {
        console.error("Failed to load my bookings for review eligibility.", error);
      }
    }

    loadMyBookings();

    return () => {
      cancelled = true;
    };
  }, [authSession?.accessToken, isCustomerSession]);

  useEffect(() => {
    if (!authSession?.accessToken) return undefined;

    const fileNames = new Set();
    reviews.forEach((review) => {
      (review.imageFileNames ?? []).forEach((fileName) => fileNames.add(fileName));
    });
    reviewDraft.images.forEach((image) => {
      if (!image.isLocalPreview && image.fileName) {
        fileNames.add(image.fileName);
      }
    });

    const unresolved = Array.from(fileNames).filter((fileName) => !reviewImagePreviewMap[fileName]);
    if (!unresolved.length) return undefined;

    let cancelled = false;

    Promise.all(
      unresolved.map(async (fileName) => ({
        fileName,
        previewUrl: await resolveProtectedReviewImageUrl(fileName, authSession.accessToken),
      })),
    ).then((rows) => {
      if (cancelled) return;
      setReviewImagePreviewMap((current) => {
        const next = { ...current };
        rows.forEach(({ fileName, previewUrl }) => {
          if (previewUrl) {
            next[fileName] = previewUrl;
          }
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [authSession?.accessToken, reviewDraft.images, reviewImagePreviewMap, reviews]);

  useEffect(() => () => revokeResolvedReviewImageUrls(reviewImagePreviewMap), []);

  useEffect(() => {
    let cancelled = false;

    async function loadWishlistState() {
      if (!authSession?.accessToken || !isCustomerSession || !lodging?.id) {
        setWishlisted(false);
        return;
      }

      try {
        const rows = await getMyWishlist();
        if (cancelled) return;
        setWishlisted(rows.some((item) => Number(item.lodgingId) === Number(lodging.id)));
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load wishlist state.", error);
        }
      }
    }

    loadWishlistState();

    return () => {
      cancelled = true;
    };
  }, [authSession?.accessToken, isCustomerSession, lodging?.id]);

  useEffect(() => {
    if (!roomOptions.length) return;
    setSelectedRoom(roomOptions[0]);
  }, [roomOptions]);

  useEffect(() => {
    if (!galleryImages.length) return;
    setSelectedImage(galleryImages[0]);
  }, [galleryImages]);

  useEffect(() => {
    if (!isInquiryOpen || !lodging || !authSession) {
      setInquiryRoomId(null);
      setChatMessages(sellerContact.messages);
      inquiryUnsubscribeRef.current();
      inquiryUnsubscribeRef.current = () => {};
      return;
    }

    let cancelled = false;

    async function loadInquiryThread() {
      setIsInquiryLoading(true);
      inquiryUnsubscribeRef.current();
      inquiryUnsubscribeRef.current = () => {};

      try {
        const room = await findMyInquiryRoomByLodgingId(lodging.id);
        if (cancelled) return;

        if (!room) {
          setInquiryRoomId(null);
          setChatMessages([]);
          return;
        }

        setInquiryRoomId(room.id);
        const nextMessages = await getSellerInquiryMessages(room.id);
        if (cancelled) return;
        setChatMessages(nextMessages);
        inquiryUnsubscribeRef.current = await subscribeSellerInquiryRoom(room.id, (message) => {
          setChatMessages((current) => (current.some((row) => row.id === message.id) ? current : [...current, message]));
        });
      } catch (error) {
        console.error("Failed to load lodging inquiry thread.", error);
      } finally {
        if (!cancelled) {
          setIsInquiryLoading(false);
        }
      }
    }

    loadInquiryThread();

    return () => {
      cancelled = true;
      inquiryUnsubscribeRef.current();
      inquiryUnsubscribeRef.current = () => {};
    };
  }, [authSession?.userNo, isInquiryOpen, lodging?.id, sellerContact.messages]);

  useEffect(() => {
    if (!isInquiryOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsInquiryOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const timer = window.setTimeout(() => {
      inquiryThreadRef.current?.scrollTo({ top: inquiryThreadRef.current.scrollHeight, behavior: "smooth" });
    }, 40);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(timer);
    };
  }, [isInquiryOpen, chatMessages]);

  const handleShare = async () => {
    if (!lodging) return;
    const targetUrl = `${window.location.origin}/lodgings/${lodging.id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
        setShareLabel("링크 복사됨");
        window.setTimeout(() => setShareLabel("공유하기"), 1800);
      }
    } catch {
      setShareLabel("공유하기");
    }
  };

  const handleWishlistToggle = async () => {
    if (!authSession?.accessToken) {
      navigate("/login");
      return;
    }

    if (isWishlistSaving || !lodging?.id) {
      return;
    }

    try {
      setIsWishlistSaving(true);
      const result = await toggleMyWishlist(lodging.id);
      setWishlisted(result.wished);
    } catch (error) {
      console.error("Failed to toggle wishlist.", error);
    } finally {
      setIsWishlistSaving(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const body = reviewDraft.body.trim();
    if (!body) return;

    const candidateBookings = reviewDraft.bookingNo
      ? completedReviewBookings.filter((booking) => Number(booking.bookingNo) === Number(reviewDraft.bookingNo))
      : completedReviewBookings.filter((booking) => !myVisibleReviewBookingNos.has(Number(booking.bookingNo)));
    if (!candidateBookings.length) {
      setReviewNotice("숙박 완료 내역이 있어야 리뷰를 등록할 수 있습니다.");
      return;
    }
    if (isReviewUploading) {
      setReviewNotice("리뷰 사진 업로드가 끝난 뒤 등록할 수 있습니다.");
      return;
    }

    try {
      if (reviewDraft.reviewId) {
        const payload = {
          bookingNo: candidateBookings[0].bookingNo,
          lodgingId: lodging.id,
          score: reviewDraft.score,
          body,
          imageFileNames: reviewDraft.images.map((image) => image.fileName),
        };
        const nextReview = await updateLodgingReview(reviewDraft.reviewId, payload);
        setReviews((current) => current.map((item) => (item.id === nextReview.id ? nextReview : item)));
        setReviewNotice("리뷰를 수정했습니다.");
      } else {
        let nextReview = null;

        for (const booking of candidateBookings) {
          const payload = {
            bookingNo: booking.bookingNo,
            lodgingId: lodging.id,
            score: reviewDraft.score,
            body,
            imageFileNames: reviewDraft.images.map((image) => image.fileName),
          };

          try {
            nextReview = await createLodgingReview(payload);
            break;
          } catch (error) {
            const message = String(error?.message ?? "");
            if (isDuplicateReviewErrorMessage(message)) {
              continue;
            }
            throw error;
          }
        }

        if (!nextReview) {
          if (myExistingReview) {
            setReviewDraft(buildReviewDraftFromReview(myExistingReview));
            setReviewNotice("이미 작성한 후기를 불러왔습니다. 수정 또는 삭제해 주세요.");
            return;
          }
          setReviewNotice("이미 작성한 예약 후기가 있어 새 후기를 등록할 수 없습니다.");
          return;
        }

        setReviews((current) => [nextReview, ...current]);
        setReviewNotice("리뷰가 등록되었습니다.");
      }

      setReviewDraft((current) => {
        revokeReviewPreviewUrls(current.images);
        return { reviewId: null, bookingNo: null, score: 5, body: "", images: [] };
      });
    } catch (error) {
      console.error("Failed to save lodging review.", error);
      const message = String(error?.message ?? "");
      const isDuplicateReviewError = isDuplicateReviewErrorMessage(message);

      if (isDuplicateReviewError && myExistingReview) {
        setReviewDraft(buildReviewDraftFromReview(myExistingReview));
        setReviewNotice("이미 작성한 후기를 불러왔습니다. 수정 또는 삭제해 주세요.");
      } else if (isDuplicateReviewError) {
        setReviewNotice("이미 작성한 후기입니다. 내 후기에서 수정하거나 관리자 숨김 여부를 확인해 주세요.");
      } else {
        setReviewNotice(reviewDraft.reviewId ? "리뷰 수정에 실패했습니다." : "리뷰 등록에 실패했습니다.");
      }
    }
  };

  const handleReviewImages = (event) => {
    const input = event.target;
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setIsReviewUploading(true);
    setReviewNotice("리뷰 사진을 업로드하는 중입니다.");

    uploadLodgingReviewImages(files)
      .then((images) => {
        setReviewDraft((current) => {
          const nextImages = [...current.images];
          images.forEach((image, index) => {
            if (!nextImages.some((currentImage) => currentImage.fileName === image.fileName)) {
              nextImages.push({
                ...image,
                previewUrl: window.URL.createObjectURL(files[index]),
                isLocalPreview: true,
              });
            }
          });
          return { ...current, images: nextImages };
        });
        setReviewNotice(images.length ? `사진 ${images.length}장을 첨부했습니다.` : "첨부 가능한 이미지가 없습니다.");
      })
      .catch((error) => {
        console.error("Failed to upload review images.", error);
        setReviewNotice("리뷰 사진 업로드에 실패했습니다.");
      })
      .finally(() => {
        setIsReviewUploading(false);
        input.value = "";
      });
  };

  const handleReviewImageRemove = (fileName) => {
    setReviewDraft((current) => {
      const target = current.images.find((image) => image.fileName === fileName);
      if (target?.isLocalPreview) {
        revokeReviewPreviewUrls([target]);
      }
      return {
        ...current,
        images: current.images.filter((image) => image.fileName !== fileName),
      };
    });
    setReviewNotice("사진을 첨부 목록에서 제외했습니다.");
  };

  const handleReviewEdit = (review) => {
    setReviewDraft((current) => {
      revokeReviewPreviewUrls(current.images);
      return buildReviewDraftFromReview(review);
    });
    reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setReviewNotice("리뷰 수정 중입니다.");
  };

  const handleReviewDelete = async (review) => {
    try {
      await deleteLodgingReview(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
      if (reviewDraft.reviewId === review.id) {
        setReviewDraft((current) => {
          revokeReviewPreviewUrls(current.images);
          return { reviewId: null, bookingNo: null, score: 5, body: "", images: [] };
        });
      }
      setReviewNotice("리뷰를 삭제했습니다.");
    } catch (error) {
      console.error("Failed to delete lodging review.", error);
      setReviewNotice("리뷰 삭제에 실패했습니다.");
    }
  };

  const resolvedReviewDraft = useMemo(
    () => ({
      ...reviewDraft,
      images: reviewDraft.images.map((image) => ({
        ...image,
        previewUrl: image.isLocalPreview ? image.previewUrl : reviewImagePreviewMap[image.fileName] ?? "",
      })),
    }),
    [reviewDraft, reviewImagePreviewMap],
  );
  const resolvedReviews = useMemo(
    () =>
      reviews.map((review) => ({
        ...review,
        imageUrls: (review.imageFileNames ?? [])
          .map((fileName) => reviewImagePreviewMap[fileName] ?? null)
          .filter(Boolean),
      })),
    [reviewImagePreviewMap, reviews],
  );

  const handleInquirySubmit = async (event) => {
    event.preventDefault();
    const body = chatDraft.trim();
    if (!body) return;

    if (!authSession?.accessToken) {
      navigate("/login");
      return;
    }

    try {
      let nextRoomId = inquiryRoomId;

      if (!nextRoomId) {
        setIsInquiryLoading(true);
        nextRoomId = await sendGuestInquiryMessage({
          lodgingId: lodging.id,
          roomId: null,
          body,
        });
        setInquiryRoomId(nextRoomId);
        inquiryUnsubscribeRef.current();
        inquiryUnsubscribeRef.current = await subscribeSellerInquiryRoom(nextRoomId, (message) => {
          setChatMessages((current) => (current.some((row) => row.id === message.id) ? current : [...current, message]));
        });
        setIsInquiryLoading(false);
      } else {
        await sendGuestInquiryMessage({
          lodgingId: lodging.id,
          roomId: nextRoomId,
          body,
        });
      }

      setChatDraft("");
    } catch (error) {
      setIsInquiryLoading(false);
      console.error("Failed to send guest inquiry message.", error);
    }
  };

  const handleInquiryDraftKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  if (!lodging) {
    if (isLodgingLoading) {
      return (
        <div className="container page-stack">
          <section className="list-empty-state list-empty-state-full">
            <strong>숙소 정보를 가져오고 있어요.</strong>
            <p>잠시만 기다려주세요.</p>
          </section>
        </div>
      );
    }

    return (
      <div className="container page-stack">
        <section className="list-empty-state list-empty-state-full">
          <strong>숙소 상세 정보를 불러오지 못했습니다.</strong>
          <p>{lodgingLoadError || "요청이 지연되거나 응답 형식이 올바르지 않습니다."}</p>
          <Link className="primary-button" to="/lodgings">
            다른 숙소 보러가기
          </Link>
        </section>
      </div>
    );
  }

  const photoIndex = galleryImages.length ? Math.max(galleryImages.indexOf(selectedImage) + 1, 1) : 1;

  return (
    <div className="container page-stack">
      {lodgingLoadError ? (
        <section className="list-empty-state" role="status" aria-live="polite">
          <strong>일부 상세 정보를 불러오지 못했습니다.</strong>
          <p>{lodgingLoadError}</p>
        </section>
      ) : null}

      <section className="lodging-hero">
        <div className="lodging-hero-visual" style={{ backgroundImage: `url(${selectedImage})` }} />
        <div className="lodging-hero-copy">
          <p className="eyebrow hero-eyebrow">{lodging.region}</p>
          <h1>{lodging.name}</h1>
          <p>{lodging.intro}</p>
          <div className="detail-hero-meta">
            <span>{lodging.region} · {lodging.district}</span>
            <button
              type="button"
              className="detail-hero-review-chip"
              onClick={() => reviewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              ★ {reviewAverage} · {reviewCountLabel}
            </button>
            <span>{lodging.type}</span>
          </div>
          <div className="feature-chip-row">
            {lodging.highlights.map((item) => (
              <span key={item} className="inline-chip inline-chip-light">
                {item}
              </span>
            ))}
          </div>
          <div className="hero-actions">
            <Link className="primary-button" to={`/booking/${lodging.id}${bookingDateSuffix}`}>
              예약하기
            </Link>
            <button
              type="button"
              className={`detail-utility-button detail-utility-button-like${wishlisted ? " is-active" : ""}`}
              onClick={handleWishlistToggle}
              disabled={isWishlistSaving}
            >
              {isWishlistSaving ? "저장 중..." : wishlisted ? "찜 완료" : "찜하기"}
            </button>
            <button type="button" className="detail-utility-button detail-utility-button-share" onClick={handleShare}>
              {shareLabel}
            </button>
            <button type="button" className="detail-utility-button detail-utility-button-inquiry" onClick={() => setIsInquiryOpen(true)}>
              숙소문의
            </button>
          </div>
        </div>
      </section>
      <div className="detail-gallery-strip">
        {galleryImages.map((image, index) => (
          <button
            key={`${lodging.id}-${index}`}
            type="button"
            className={`detail-gallery-thumb${selectedImage === image ? " is-active" : ""}`}
            style={{ backgroundImage: `url(${image})` }}
            onClick={() => setSelectedImage(image)}
            aria-label={`숙소 사진 ${index + 1}`}
          />
        ))}
      </div>
      <div className="detail-photo-meta" />

      <section className="detail-grid">
        <section className="detail-main">
          <div className="detail-overview-stage">
            <div className="detail-headline detail-headline-editorial">
              <span className="small-label">숙소 개요</span>
            </div>
            <div className="detail-overview-copy">
              <div className="detail-overview-inline">
                <div>
                  <span>추천 이유</span>
                  <strong>{lodging.highlights[1] ?? lodging.highlights[0] ?? "위치와 동선이 편한 숙소"}</strong>
                </div>
                <div>
                  <span>예약 포인트</span>
                  <strong>{selectedRoom ? `${selectedRoom.price}부터` : "객실 확인 필요"}</strong>
                </div>
                <div>
                  <span>호스트 응답</span>
                  <strong>{sellerContact.badge}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-info-rail">
            <div className="detail-info-item">
              <strong>평점</strong>
              <p className="detail-info-rating-value">★ {reviewAverage} · {reviewCountLabel}</p>
            </div>
            <div className="detail-info-item">
              <strong>체크인</strong>
              <p>{lodging.checkInTime}</p>
            </div>
            <div className="detail-info-item">
              <strong>체크아웃</strong>
              <p>{lodging.checkOutTime}</p>
            </div>
            <div className="detail-info-item detail-info-item-policy">
              <strong>취소 정책</strong>
              <p>{lodging.cancellation}</p>
            </div>
          </div>

          <RoomOptionsSection lodging={lodging} roomOptions={roomOptions} selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />

          <section className="detail-review-section">
            <div className="detail-headline">
              <span className="small-label">숙소 소개</span>
            </div>
            <div className="detail-story">
              {propertyStory.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </section>

          <section className="detail-review-section">
            <div className="detail-headline">
              <span className="small-label">이용 가이드</span>
              <h2>예약 전에 보면 좋은 운영 정보</h2>
            </div>
            <div className="detail-guide-list">
              <div className="detail-guide-item">
                <strong>체크인 기본 정보</strong>
                <ul className="detail-guide-bullets">
                  <li>체크인 {lodging.checkInTime} · 체크아웃 {lodging.checkOutTime}</li>
                  <li>{lodging.room}</li>
                  <li>{lodging.type}</li>
                </ul>
              </div>
              <div className="detail-guide-item">
                <strong>예약 진행 포인트</strong>
                <ul className="detail-guide-bullets">
                  <li>{lodging.status === "ACTIVE" ? "즉시 예약 확정" : "예약 후 호스트 확인 필요"}</li>
                  <li>무료 취소 가능 여부는 객실별 정책을 확인하세요.</li>
                  <li>반려동물 동반 여부는 호스트에게 문의하세요.</li>
                </ul>
              </div>
              <div className="detail-guide-item">
                <strong>현장 체크 메모</strong>
                <ul className="detail-guide-bullets">
                  <li>취소 정책은 예약 단계에서 객실별로 확인할 수 있습니다.</li>
                  <li>체크인 당일 취소 시 환불이 제한될 수 있습니다.</li>
                  <li>추가 인원 요금은 숙소에 따라 별도 청구될 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="detail-review-section">
            <div className="detail-headline">
              <span className="small-label">위치</span>
              <h2>숙소 위치</h2>
            </div>
            <StayMap items={[lodging]} selectedId={lodging.id} height={360} single />
          </section>

          <section ref={reviewSectionRef}>
            <ReviewSection
              authSession={authSession}
              canWriteReview={canWriteReview}
              reviewAverage={reviewAverage}
              reviewCountLabel={reviewCountLabel}
              reviewDraft={resolvedReviewDraft}
              reviews={resolvedReviews}
              onChangeDraft={(patch) => setReviewDraft((current) => ({ ...current, ...patch }))}
              onSubmit={handleReviewSubmit}
              onImageChange={handleReviewImages}
              onRemoveImage={handleReviewImageRemove}
              onEdit={handleReviewEdit}
              onDelete={handleReviewDelete}
            />
            {isReviewLoading ? <div className="my-empty-inline">리뷰를 불러오는 중입니다.</div> : null}
            {reviewNotice ? <div className="my-empty-inline">{reviewNotice}</div> : null}
          </section>
        </section>

          <StickyBookingCard
            lodging={lodging}
            selectedRoom={selectedRoom}
            roomBaseMeta={roomBaseMeta}
            bookingDateSuffix={bookingDateSuffix}
            ratingLabel={reviewAverage}
            reviewCountLabel={reviewCountLabel}
          />
      </section>

      {isInquiryOpen && (
        <div className="lodging-inquiry-modal" role="dialog" aria-modal="true" aria-labelledby="lodging-inquiry-title">
          <button type="button" className="lodging-inquiry-backdrop" aria-label="문의 팝업 닫기" onClick={() => setIsInquiryOpen(false)} />
          <section className="lodging-inquiry-sheet">
            <header className="lodging-inquiry-header">
              <div className="lodging-inquiry-host">
                <span className="lodging-inquiry-avatar">{sellerContact.name.slice(0, 1)}</span>
                <div>
                  <p className="lodging-inquiry-eyebrow">숙소 문의</p>
                  <h2 id="lodging-inquiry-title">{sellerContact.name}</h2>
                  <div className="lodging-inquiry-status">
                    <span>{sellerContact.status}</span>
                    <span>{sellerContact.badge}</span>
                  </div>
                </div>
              </div>
              <button type="button" className="lodging-inquiry-close" onClick={() => setIsInquiryOpen(false)}>
                닫기
              </button>
            </header>

            <div className="lodging-inquiry-summary">
              <strong>{lodging.name}</strong>
              <span>{selectedRoom ? `${selectedRoom.name} · ` : ""}{lodging.checkInTime} 체크인 · {lodging.cancellation}</span>
            </div>

            <div className="lodging-inquiry-thread" ref={inquiryThreadRef}>
              {!chatMessages.length && !isInquiryLoading ? (
                <article className="lodging-chat-bubble is-seller">
                  <span className="lodging-chat-time">안내</span>
                  <p>체크인 시간, 객실 옵션, 주차 여부처럼 예약 전에 확인할 내용을 남겨보세요.</p>
                </article>
              ) : null}
              {chatMessages.map((message) => (
                <article key={message.id} className={`lodging-chat-bubble is-${getChatBubbleTone(message.sender)}`}>
                  <span className="lodging-chat-time">{message.time}</span>
                  <p>{message.body}</p>
                </article>
              ))}
            </div>

            <form className="lodging-inquiry-form" onSubmit={handleInquirySubmit}>
              <textarea
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                onKeyDown={handleInquiryDraftKeyDown}
                placeholder="체크인 시간, 주차, 바비큐, 객실 배정처럼 예약 전 확인할 내용을 남겨보세요."
                rows={3}
              />
              <div className="lodging-inquiry-form-foot">
                <span>회원 메시지는 판매자 대시보드 문의관리와 같은 흐름으로 이어집니다.</span>
                <button type="submit" className="primary-button" disabled={isInquiryLoading}>
                  {isInquiryLoading ? "연결 중..." : "보내기"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
