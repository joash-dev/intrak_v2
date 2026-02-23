import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  Calendar,
  Users,
  Pin,
  X,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import {
  announcementService,
  type Announcement,
} from "../../services/announcementService";
import { aiService } from "../../services/aiService";
import AIGenerateButton from "../../components/ai/AIGenerateButton";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";

type AudienceOption =
  | "ALL"
  | "STUDENTS"
  | "COORDINATORS"
  | "INSTRUCTORS"
  | "INDUSTRY_PARTNERS";

interface CoordinatorAnnouncementsTabProps {
  defaultAudience?: AudienceOption;
}

const ITEMS_PER_PAGE = 10;

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: "All Users",
  STUDENTS: "Students",
  COORDINATORS: "Coordinators",
  INSTRUCTORS: "Instructors",
  INDUSTRY_PARTNERS: "Industry Partners",
};

const CoordinatorAnnouncementsTab: React.FC<CoordinatorAnnouncementsTabProps> = ({
  defaultAudience = "ALL",
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    audience: defaultAudience as AudienceOption,
    type: "info" as "info" | "warning" | "success" | "urgent",
    isPinned: false,
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<{
    id: string;
    title: string;
    content: string;
    audience: AudienceOption;
    type: "info" | "warning" | "success" | "urgent";
    isPinned: boolean;
  } | null>(null);

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await announcementService.getAnnouncements();
      const transformedAnnouncements = response.announcements.map(
        (announcement) =>
          announcementService.transformAnnouncement(announcement)
      );
      setAnnouncements(transformedAnnouncements);
    } catch (err: any) {
      console.error("Error fetching announcements:", err);
      setError(err.response?.data?.message || "Failed to fetch announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (!showCreateModal) {
      setNewAnnouncement((prev) => ({
        ...prev,
        audience: defaultAudience,
      }));
    }
  }, [defaultAudience, showCreateModal]);

  // Track view only when a user expands / views an announcement (not bulk)
  const trackAnnouncementView = async (announcementId: string) => {
    try {
      await announcementService.trackView(announcementId);
    } catch (error) {
      console.warn("Failed to track view:", error);
    }
  };

  const stats = announcementService.calculateStats(announcements);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-500",
      warning:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-500",
      success:
        "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-500",
      urgent:
        "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-500",
    };
    return colors[type] || colors.info;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "urgent":
        return <Bell className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await announcementService.createAnnouncement({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        audience: newAnnouncement.audience,
        type: newAnnouncement.type,
        isPinned: newAnnouncement.isPinned,
      });

      toast.success("Announcement posted successfully!");
      await fetchAnnouncements();

      setNewAnnouncement({
        title: "",
        content: "",
        audience: defaultAudience,
        type: "info",
        isPinned: false,
      });

      setShowCreateModal(false);
    } catch (err: any) {
      console.error("Error creating announcement:", err);
      toast.error(err.response?.data?.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content || announcement.message || "",
      audience: announcement.audience,
      type: announcement.type || "info",
      isPinned: announcement.isPinned || false,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAnnouncement) return;

    if (!editingAnnouncement.title || !editingAnnouncement.content) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      await announcementService.updateAnnouncement(editingAnnouncement.id, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        audience: editingAnnouncement.audience,
        type: editingAnnouncement.type,
        isPinned: editingAnnouncement.isPinned,
      });

      toast.success("Announcement updated successfully");
      await fetchAnnouncements();
      setShowEditModal(false);
      setEditingAnnouncement(null);
    } catch (err: any) {
      console.error("Error updating announcement:", err);
      toast.error(err.response?.data?.message || "Failed to update announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    try {
      await announcementService.deleteAnnouncement(deletingAnnouncement.id);
      toast.success("Announcement deleted successfully");
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Error deleting announcement:", err);
      toast.error(err.response?.data?.message || "Failed to delete announcement");
    } finally {
      setShowDeleteModal(false);
      setDeletingAnnouncement(null);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      await announcementService.updateAnnouncement(announcement.id, {
        isPinned: !announcement.isPinned,
      });

      toast.success(
        `Announcement ${announcement.isPinned ? "unpinned" : "pinned"} successfully`
      );
      await fetchAnnouncements();
    } catch (err: any) {
      console.error("Error toggling pin:", err);
      toast.error("Failed to toggle pin status");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Track view when user actively reads the announcement
        trackAnnouncementView(id);
      }
      return next;
    });
  };

  // ---------- Filtering & Pagination ----------
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (announcement.content || announcement.message || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === "all" || (announcement.type || "info") === filterType;
    const matchesAudience =
      filterAudience === "all" || announcement.audience === filterAudience;
    return matchesSearch && matchesType && matchesAudience;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  const totalPages = Math.max(1, Math.ceil(regularAnnouncements.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRegular = regularAnnouncements.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterAudience]);

  // ---------- Render helpers ----------
  const renderAnnouncementCard = (announcement: Announcement, isPinnedSection: boolean) => {
    const isExpanded = expandedIds.has(announcement.id);
    const contentText = announcement.content || announcement.message || "";
    const isLong = contentText.length > 200;

    return (
      <div
        key={announcement.id}
        className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md"
      >
        <div className="p-5 sm:p-6">
          {/* Top row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${getTypeColor(announcement.type || "info")}`}
              >
                {getTypeIcon(announcement.type || "info")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    {announcement.title}
                  </h3>
                  {isPinnedSection && (
                    <Pin className="w-3.5 h-3.5 text-blue-500 fill-current shrink-0" />
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 ${getTypeColor(
                      announcement.type || "info"
                    )}`}
                  >
                    {announcement.type || "info"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 shrink-0">
                    {AUDIENCE_LABELS[announcement.audience] || announcement.audience}
                  </span>
                </div>
                {/* Content with expand/collapse */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 whitespace-pre-line">
                  {isLong && !isExpanded
                    ? contentText.slice(0, 200) + "..."
                    : contentText}
                </p>
                {isLong && (
                  <button
                    onClick={() => toggleExpand(announcement.id)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mb-2"
                  >
                    {isExpanded ? (
                      <>
                        Show less <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {announcementService.formatDate(
                      announcement.createdAt || announcement.createdDate || ""
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {announcement.createdBy?.name || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {announcement.views} {announcement.views === 1 ? "view" : "views"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-1.5 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => handleTogglePin(announcement)}
              className={`p-2 rounded-lg transition-colors ${
                announcement.isPinned
                  ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              title={announcement.isPinned ? "Unpin" : "Pin"}
            >
              <Pin className={`w-4 h-4 ${announcement.isPinned ? "fill-current" : ""}`} />
            </button>
            <button
              onClick={() => handleEdit(announcement)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => confirmDelete(announcement)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#212124] rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Announcements
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#212124] rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                Announcements
              </h1>
              {stats.total > 0 && (
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  {stats.total}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Create and manage announcements for your audience
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnnouncements}
            className="p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setNewAnnouncement((prev) => ({
                ...prev,
                audience: defaultAudience,
              }));
              setShowCreateModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg sm:rounded-xl transition-colors font-medium shadow-sm text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Stats Cards — soft pastel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
                Total
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Pin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
                Pinned
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.pinned}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
                This Week
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.thisWeek}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#212124] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
                Avg. Views
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.avgViews}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#212124] rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="urgent">Urgent</option>
          </select>
          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Audiences</option>
            <option value="ALL">All Users</option>
            <option value="STUDENTS">Students</option>
            <option value="COORDINATORS">Coordinators</option>
            <option value="INSTRUCTORS">Instructors</option>
            <option value="INDUSTRY_PARTNERS">Industry Partners</option>
          </select>
        </div>
      </div>

      {/* Pinned Announcements */}
      {pinnedAnnouncements.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Pin className="w-4 h-4 text-blue-500" />
            Pinned ({pinnedAnnouncements.length})
          </h2>
          <div className="space-y-3">
            {pinnedAnnouncements.map((a) => renderAnnouncementCard(a, true))}
          </div>
        </div>
      )}

      {/* Regular Announcements */}
      <div>
        {pinnedAnnouncements.length > 0 && (
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            All Announcements ({regularAnnouncements.length})
          </h2>
        )}
        <div className="space-y-3">
          {paginatedRegular.map((a) => renderAnnouncementCard(a, false))}
        </div>
      </div>

      {/* Empty state */}
      {filteredAnnouncements.length === 0 && (
        <div className="bg-white dark:bg-[#212124] rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
          <MessageSquare className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            No announcements found
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {searchQuery || filterType !== "all" || filterAudience !== "all"
              ? "Try adjusting your filters"
              : "Create your first announcement to get started"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-[#212124] rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(safePage * ITEMS_PER_PAGE, regularAnnouncements.length)} of{" "}
            {regularAnnouncements.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - safePage) <= 1
              )
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                typeof p === "string" ? (
                  <span key={`e${i}`} className="px-1 text-gray-400 text-xs">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                      p === safePage
                        ? "bg-purple-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =================== Create Modal =================== */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          style={{ margin: 0 }}
          onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
        >
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Announcement
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                  }
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-red-500">*</span>
                  </label>
                  {newAnnouncement.title && newAnnouncement.audience && (
                    <AIGenerateButton
                      onGenerate={async () => {
                        return aiService.generateAnnouncementContent({
                          title: newAnnouncement.title,
                          audience: newAnnouncement.audience,
                          type: newAnnouncement.type,
                        });
                      }}
                      onSuccess={(generatedText) => {
                        setNewAnnouncement({ ...newAnnouncement, content: generatedText });
                        toast.success("Content generated successfully");
                      }}
                      disabled={!newAnnouncement.title || !newAnnouncement.audience}
                      size="sm"
                      variant="outline"
                    />
                  )}
                </div>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                  }
                  placeholder="Enter announcement message"
                  rows={5}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Type
                  </label>
                  <select
                    value={newAnnouncement.type}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, type: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={newAnnouncement.audience}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, audience: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="COORDINATORS">Coordinators Only</option>
                    <option value="INSTRUCTORS">Instructors Only</option>
                    <option value="INDUSTRY_PARTNERS">Industry Partners Only</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newAnnouncement.isPinned}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, isPinned: e.target.checked })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Pin this announcement
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium text-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{submitting ? "Posting..." : "Post Announcement"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== Edit Modal =================== */}
      {showEditModal && editingAnnouncement && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          style={{ margin: 0 }}
          onClick={(e) => e.target === e.currentTarget && (setShowEditModal(false), setEditingAnnouncement(null))}
        >
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Announcement
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingAnnouncement.title}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })
                  }
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message <span className="text-red-500">*</span>
                  </label>
                  {editingAnnouncement.title && editingAnnouncement.audience && (
                    <AIGenerateButton
                      onGenerate={async () => {
                        return aiService.generateAnnouncementContent({
                          title: editingAnnouncement.title,
                          audience: editingAnnouncement.audience,
                          type: editingAnnouncement.type,
                        });
                      }}
                      onSuccess={(generatedText) => {
                        setEditingAnnouncement({ ...editingAnnouncement, content: generatedText });
                        toast.success("Content generated successfully");
                      }}
                      disabled={!editingAnnouncement.title || !editingAnnouncement.audience}
                      size="sm"
                      variant="outline"
                    />
                  )}
                </div>
                <textarea
                  value={editingAnnouncement.content}
                  onChange={(e) =>
                    setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })
                  }
                  placeholder="Enter announcement message"
                  rows={5}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Type
                  </label>
                  <select
                    value={editingAnnouncement.type}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        type: e.target.value as "info" | "warning" | "success" | "urgent",
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={editingAnnouncement.audience}
                    onChange={(e) =>
                      setEditingAnnouncement({
                        ...editingAnnouncement,
                        audience: e.target.value as AudienceOption,
                      })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-[#2a2a2d] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="ALL">All Users</option>
                    <option value="STUDENTS">Students Only</option>
                    <option value="COORDINATORS">Coordinators Only</option>
                    <option value="INSTRUCTORS">Instructors Only</option>
                    <option value="INDUSTRY_PARTNERS">Industry Partners Only</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingAnnouncement.isPinned}
                  onChange={(e) =>
                    setEditingAnnouncement({
                      ...editingAnnouncement,
                      isPinned: e.target.checked,
                    })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Pin this announcement
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                }}
                className="px-5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors font-medium text-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4" />
                )}
                <span>{submitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== Delete Confirmation Modal =================== */}
      {showDeleteModal && deletingAnnouncement && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          style={{ margin: 0 }}
          onClick={(e) => e.target === e.currentTarget && (setShowDeleteModal(false), setDeletingAnnouncement(null))}
        >
          <div className="bg-white dark:bg-[#212124] rounded-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Announcement
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{deletingAnnouncement.title}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingAnnouncement(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorAnnouncementsTab;
