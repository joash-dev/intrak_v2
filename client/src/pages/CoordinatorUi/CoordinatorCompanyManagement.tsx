import React, { useMemo, useState } from "react";
import {
  Building2,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  // Filter,
  Plus,
  Trash2,
  Eye,
  Download,
  // Upload,
  // RefreshCw,
  Loader2,
  X,
  UserPlus,
  MailCheck,
  SquarePen,
} from "lucide-react";
import { coordinatorService } from "../../services/coordinatorService";
import { formatDate } from "../../services/localeService";
import type { CoordinatorStudent } from "../../services/coordinatorService";
import { useOptimizedData } from "../../hooks/useOptimizedData";
import toast from "react-hot-toast";
import Skeleton from "../../components/Skeleton";
import {
  companyProposalService,
  type CompanyProposal,
} from "../../services/companyProposalService";

// Import types from the service
import type { Company, MOA } from "../../services/companyService";

const normalizeForMatch = (value?: string | null) =>
  (value || "").trim().toLowerCase().replace(/\s+/g, " ");

const CoordinatorCompanyManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [moaStatusFilter, setMoaStatusFilter] = useState("all");
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddMOA, setShowAddMOA] = useState(false);
  const [selectedMOA, setSelectedMOA] = useState<MOA | null>(null);
  const [selectedStudentForMOA, setSelectedStudentForMOA] =
    useState<CoordinatorStudent | null>(null);
  const [showMOAPreview, setShowMOAPreview] = useState(false);
  const [previewingMOAId, setPreviewingMOAId] = useState<string | null>(null);
  const [downloadingMOAId, setDownloadingMOAId] = useState<string | null>(null);
  const [showCompanyMOAsModal, setShowCompanyMOAsModal] = useState(false);
  const [companyForMOAModal, setCompanyForMOAModal] = useState<Company | null>(
    null
  );
  const [companyMOAsSnapshot, setCompanyMOAsSnapshot] = useState<MOA[]>([]);
  const [loadingCompanyMOAs, setLoadingCompanyMOAs] = useState(false);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [creatingSupervisorId, setCreatingSupervisorId] = useState<string | null>(
    null
  );
  const [supervisorError, setSupervisorError] = useState<{
    companyId: string;
    message: string;
  } | null>(null);
  const [supervisorSuccessModal, setSupervisorSuccessModal] = useState<
    | {
      companyName: string;
      supervisorName: string;
      supervisorEmail: string;
      temporaryPassword?: string;
      emailSent: boolean;
      emailMessage?: string;
      wasCreated: boolean;
    }
    | null
  >(null);

  const renderSupervisorError = (companyId: string) => {
    if (supervisorError?.companyId === companyId) {
      return (
        <div className="mt-3 rounded-lg border border-red-200 dark:border-red-700 bg-red-50/70 dark:bg-red-900/20 px-3 py-2 text-xs text-red-600 dark:text-red-300">
          {supervisorError.message}
        </div>
      );
    }
    return null;
  };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Loading states for form submissions
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [isAddingMOA, setIsAddingMOA] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState(false);

  // Add MOA form state
  const [moaForm, setMoaForm] = useState({
    title: "",
    description: "",
    studentId: "",
    companyId: "",
    file: null as File | null,
  });

  const resetMOAForm = () => {
    setMoaForm({
      title: "",
      description: "",
      studentId: "",
      companyId: "",
      file: null,
    });
    setSelectedStudentForMOA(null);
  };

  // Add Company form state
  const createEmptyCompanyForm = () => ({
    name: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactNumber: "",
    latitude: "",
    longitude: "",
    radiusMeters: 100,
    maxSlots: "0",
    companyType: "PUBLIC" as "PUBLIC" | "PRIVATE",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as string[],
  });
  const [companyForm, setCompanyForm] = useState(createEmptyCompanyForm);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [selectedApprovedProposalId, setSelectedApprovedProposalId] = useState("");

  const resetCompanyForm = () => {
    setCompanyForm(createEmptyCompanyForm());
    setEditingCompanyId(null);
    setSelectedApprovedProposalId("");
  };

  const isEditingCompany = Boolean(editingCompanyId);

  const handleOpenAddCompany = () => {
    resetCompanyForm();
    setShowAddCompany(true);
  };

  const openEditCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setSelectedApprovedProposalId("");
    setCompanyForm({
      name: company.name || "",
      address: company.address || "",
      contactPerson: company.contactPerson || "",
      contactEmail: company.contactEmail || "",
      contactNumber: company.contactNumber || "",
      latitude:
        company.latitude !== undefined && company.latitude !== null
          ? String(company.latitude)
          : "",
      longitude:
        company.longitude !== undefined && company.longitude !== null
          ? String(company.longitude)
          : "",
      radiusMeters: company.radiusMeters ?? 100,
      maxSlots: (company.maxSlots ?? 0).toString(),
      companyType: (company.companyType || "PUBLIC") as "PUBLIC" | "PRIVATE",
      workingDays: company.workingDays || (company.companyType === "PRIVATE"
        ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
    });
    setShowAddCompany(true);
  };

  // Optimized data fetching with caching
  const {
    data: companies = [],
    loading: companiesLoading,
    refresh: refreshCompanies,
  } = useOptimizedData<Company[]>(
    () => coordinatorService.getAllCompanies(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const {
    data: students = [],
    loading: studentsLoading,
    refresh: refreshStudents,
  } = useOptimizedData<CoordinatorStudent[]>(
    () => coordinatorService.getAllStudents(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const {
    data: moas = [],
    loading: moasLoading,
    refresh: refreshMOAs,
  } = useOptimizedData<MOA[]>(
    () => coordinatorService.getAllMOAs(),
    [],
    { ttl: 5 * 60 * 1000 } // 5 minutes cache
  );

  const { data: approvedCompanyProposals = [] } = useOptimizedData<CompanyProposal[]>(
    () => companyProposalService.getCoordinatorProposals("APPROVED"),
    [],
    { ttl: 2 * 60 * 1000 }
  );

  const loading = companiesLoading || studentsLoading || moasLoading;

  const unusedApprovedProposals = useMemo(() => {
    const existingNames = new Set(
      (companies || []).map((company) => normalizeForMatch(company.name))
    );
    return (approvedCompanyProposals || []).filter(
      (proposal) => !existingNames.has(normalizeForMatch(proposal.companyName))
    );
  }, [approvedCompanyProposals, companies]);

  const approvedProposalLookup = useMemo(() => {
    const byName = new Map<string, CompanyProposal>();
    const byEmail = new Map<string, CompanyProposal>();

    (approvedCompanyProposals || []).forEach((proposal) => {
      const nameKey = normalizeForMatch(proposal.companyName);
      const emailKey = normalizeForMatch(proposal.contactEmail);
      if (nameKey && !byName.has(nameKey)) byName.set(nameKey, proposal);
      if (emailKey && !byEmail.has(emailKey)) byEmail.set(emailKey, proposal);
    });

    return { byName, byEmail };
  }, [approvedCompanyProposals]);

  const applyApprovedProposalToCompanyForm = (proposalId: string) => {
    setSelectedApprovedProposalId(proposalId);
    if (!proposalId) {
      return;
    }

    const proposal = unusedApprovedProposals.find((item) => item.id === proposalId);
    if (!proposal) return;

    setCompanyForm((prev) => ({
      ...prev,
      name: proposal.companyName || prev.name,
      address: proposal.address || prev.address,
      contactPerson: proposal.contactPerson || prev.contactPerson,
      contactEmail: proposal.contactEmail || prev.contactEmail,
      contactNumber: proposal.contactNumber || prev.contactNumber,
    }));
  };

  const studentsWithCompanies = useMemo(
    () =>
      (students || []).filter(
        (student) =>
          student.companyId &&
          student.company &&
          student.company !== "No Company"
      ),
    [students]
  );

  const filteredStudentsForMOA = useMemo(() => {
    if (!moaForm.companyId) {
      return studentsWithCompanies;
    }
    return studentsWithCompanies.filter(
      (student) => student.companyId === moaForm.companyId
    );
  }, [studentsWithCompanies, moaForm.companyId]);

  const selectedCompany = useMemo(
    () =>
      (companies || []).find((company) => company.id === moaForm.companyId) ||
      null,
    [companies, moaForm.companyId]
  );

  // Filter companies based on search and status
  const filteredCompanies = (companies || []).filter((company) => {
    const matchesSearch =
      (company.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.contactPerson || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (company.contactEmail || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    // Since companies don't have a status field in the current schema, we'll show all
    return matchesSearch;
  });

  // Filter MOAs based on search and status
  // const filteredMOAs = (moas || []).filter((moa) => {
  //   const matchesSearch =
  //     (moa.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     (moa.student?.company?.name || "")
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase());
  //   const matchesStatus =
  //     moaStatusFilter === "all" || moa.status === moaStatusFilter;
  //   return matchesSearch && matchesStatus;
  // });

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { color: "text-green-600 bg-green-100", icon: CheckCircle };
      case "PENDING":
        return { color: "text-yellow-600 bg-yellow-100", icon: Clock };
      case "REJECTED":
        return { color: "text-red-600 bg-red-100", icon: XCircle };
      default:
        return { color: "text-gray-600 bg-gray-100", icon: Clock };
    }
  };

  // Check if MOA is expiring soon (within 30 days) - using uploadedAt as proxy
  const isExpiringSoon = (uploadedAt?: string) => {
    if (!uploadedAt) return false;
    const uploaded = new Date(uploadedAt);
    const now = new Date();
    const diffTime = now.getTime() - uploaded.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 335 && diffDays <= 365; // Approaching 1 year
  };

  // Check if MOA is expired - using uploadedAt as proxy
  const isExpired = (uploadedAt?: string) => {
    if (!uploadedAt) return false;
    const uploaded = new Date(uploadedAt);
    const now = new Date();
    const diffTime = now.getTime() - uploaded.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 365; // More than 1 year old
  };

  const urgentMOAs = useMemo(
    () =>
      (moas || []).filter(
        (moa) => isExpiringSoon(moa.uploadedAt) || isExpired(moa.uploadedAt)
      ),
    [moas]
  );

  // Handle MOA approval
  const handleApproveMOA = async (moaId: string) => {
    try {
      const result = await coordinatorService.approveMOA(
        moaId,
        "Approved by coordinator"
      );
      await Promise.all([refreshMOAs(), refreshCompanies(), refreshStudents()]);
      toast.success("MOA approved successfully.");

      if (result?.moa) {
        setCompanyMOAsSnapshot((prev) =>
          prev.map((existing) =>
            existing.id === result.moa.id ? (result.moa as MOA) : existing
          )
        );
      }

      if (selectedMOA?.id === moaId) {
        setSelectedMOA(null);
        setShowMOAPreview(false);
      }
    } catch (error) {
      console.error("Error approving MOA:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to approve MOA. Please try again.";
      toast.error(message);
    }
  };

  // Handle MOA rejection
  const handleRejectMOA = async (moaId: string) => {
    try {
      const reason = prompt("Please provide a reason for rejection:");
      if (!reason) {
        return;
      }

      await coordinatorService.rejectMOA(moaId, reason);
      await Promise.all([refreshMOAs(), refreshCompanies(), refreshStudents()]);
      toast.success("MOA rejected.");

      setCompanyMOAsSnapshot((prev) =>
        prev.map((existing) =>
          existing.id === moaId
            ? { ...existing, status: "REJECTED", remarks: reason }
            : existing
        )
      );

      if (selectedMOA?.id === moaId) {
        setSelectedMOA(null);
        setShowMOAPreview(false);
      }
    } catch (error) {
      console.error("Error rejecting MOA:", error);
      toast.error("Failed to reject MOA. Please try again.");
    }
  };

  // Handle Add Company form submission
  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingCompany(true);
    try {
      const maxSlotsValue = parseInt(companyForm.maxSlots, 10);
      const { maxSlots, ...restCompanyForm } = companyForm;

      const companyData = {
        ...restCompanyForm,
        latitude: companyForm.latitude
          ? parseFloat(companyForm.latitude)
          : undefined,
        longitude: companyForm.longitude
          ? parseFloat(companyForm.longitude)
          : undefined,
        radiusMeters: parseInt(companyForm.radiusMeters.toString()),
        maxSlots: Number.isNaN(maxSlotsValue) ? 0 : maxSlotsValue,
        companyType: companyForm.companyType,
        workingDays: companyForm.workingDays,
      };

      if (isEditingCompany && editingCompanyId) {
        await coordinatorService.updateCompany(editingCompanyId, companyData);
        toast.success("Company updated successfully.");
      } else {
        await coordinatorService.createCompany(companyData);
        toast.success("Company added successfully.");
      }

      setShowAddCompany(false);
      resetCompanyForm();

      // Refresh companies data
      await refreshCompanies();
    } catch (error) {
      console.error("Error saving company:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save company. Please try again.";
      toast.error(message);
    } finally {
      setIsAddingCompany(false);
    }
  };

  // Handle Add MOA form submission
  const handleAddMOA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingMOA(true);
    try {
      if (!moaForm.companyId) {
        toast.error("Please select the company this MOA belongs to.");
        return;
      }
      if (!moaForm.studentId) {
        toast.error("Please select the student associated with this MOA.");
        return;
      }
      if (!moaForm.file) {
        toast.error("Please select a file to upload.");
        return;
      }
      const formData = new FormData();
      formData.append("title", moaForm.title);
      formData.append("description", moaForm.description);
      formData.append("studentId", moaForm.studentId);
      formData.append("companyId", moaForm.companyId);
      formData.append("file", moaForm.file);
      formData.append("type", "MOA");

      await coordinatorService.uploadMOA(formData);
      toast.success("MOA uploaded successfully.");
      resetMOAForm();
      setShowAddMOA(false);

      // Refresh related data
      await Promise.all([refreshMOAs(), refreshCompanies(), refreshStudents()]);
    } catch (error) {
      console.error("Error uploading MOA:", error);
      toast.error("Failed to upload MOA. Please try again.");
    } finally {
      setIsAddingMOA(false);
    }
  };

  // Handle file selection for MOA
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setMoaForm((prev) => ({ ...prev, file }));
  };

  // Handle delete company
  const handleDeleteCompany = async () => {
    if (!companyToDelete || deleteConfirmText !== "delete") {
      return;
    }

    setIsDeletingCompany(true);
    try {
      await coordinatorService.deleteCompany(companyToDelete.id);
      setShowDeleteConfirm(false);
      setCompanyToDelete(null);
      setDeleteConfirmText("");

      // Refresh all data to reflect the deletion
      await Promise.all([refreshCompanies(), refreshStudents(), refreshMOAs()]);
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company. Please try again.");
    } finally {
      setIsDeletingCompany(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (company: Company) => {
    // Don't open modal if company has assigned students
    if (company._count?.students && company._count.students > 0) {
      alert(
        `Cannot delete company "${company.name}" because it has ${company._count.students
        } assigned student${company._count.students !== 1 ? "s" : ""
        }. Please unassign all students first.`
      );
      return;
    }

    setCompanyToDelete(company);
    setShowDeleteConfirm(true);
    setDeleteConfirmText("");
  };

  const handlePreviewMOA = async (moaId: string) => {
    try {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl(null);
      }
      setPreviewingMOAId(moaId);
      setSelectedMOA(null);
      setPreviewError(null);
      setPreviewMimeType(null);
      setShowMOAPreview(true);
      const detailedMOA = await coordinatorService.getMOAById(moaId);
      setSelectedMOA(detailedMOA);

      const response = await coordinatorService.downloadMOA(moaId);
      const blob = response.data;
      const objectUrl = URL.createObjectURL(blob);
      setPreviewObjectUrl(objectUrl);
      setPreviewMimeType(
        response.headers["content-type"] || "application/octet-stream"
      );
    } catch (error) {
      console.error("Error loading MOA details:", error);
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Failed to load MOA preview. Please try again."
      );
      toast.error("Failed to load MOA preview.");
    } finally {
      setPreviewingMOAId(null);
    }
  };

  const handleDownloadMOA = async (moa: MOA) => {
    try {
      setDownloadingMOAId(moa.id);
      const response = await coordinatorService.downloadMOA(moa.id);

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      let filename =
        moa.title?.replace(/[^a-z0-9-_]+/gi, "_") || "moa-document";
      const disposition = response.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      } else if (moa.filepath) {
        const pathParts = moa.filepath.split(/[\\/]/);
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart) {
          filename = lastPart;
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("MOA download started.");
    } catch (error) {
      console.error("Error downloading MOA:", error);
      toast.error("Failed to download MOA. Please try again.");
    } finally {
      setDownloadingMOAId(null);
    }
  };

  const closePreviewModal = () => {
    setShowMOAPreview(false);
    setSelectedMOA(null);
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setPreviewObjectUrl(null);
    setPreviewMimeType(null);
    setPreviewError(null);
  };

  const closeCompanyMOAModal = () => {
    setShowCompanyMOAsModal(false);
    setCompanyMOAsSnapshot([]);
    setCompanyForMOAModal(null);
    setLoadingCompanyMOAs(false);
  };

  const handleViewAllCompanyMOAs = async (company: Company) => {
    try {
      setLoadingCompanyMOAs(true);
      setCompanyForMOAModal(company);
      setCompanyMOAsSnapshot([]);
      const allCompanyMOAs =
        (await coordinatorService.getAllMOAs({ companyId: company.id })) || [];

      if (allCompanyMOAs.length === 0) {
        toast.error("This company has no MOA documents yet.");
        setCompanyForMOAModal(null);
        setLoadingCompanyMOAs(false);
        return;
      }

      setCompanyMOAsSnapshot(allCompanyMOAs);
      setShowCompanyMOAsModal(true);
    } catch (error) {
      console.error("Error loading MOAs for company:", error);
      toast.error("Failed to load MOAs for this company. Please try again.");
      setCompanyForMOAModal(null);
    } finally {
      setLoadingCompanyMOAs(false);
    }
  };

  const handleCreateSupervisorAccount = async (company: Company) => {
    let errorMessage: string | null = null;
    try {
      setCreatingSupervisorId(company.id);
      setSupervisorError(null);
      const result = await coordinatorService.createSupervisorAccount(
        company.id
      );

      await Promise.all([refreshCompanies(), refreshStudents()]);

      if (result.emailSent) {
        toast.success(
          result.emailMessage ||
          `Email has been sent to ${result.supervisor.email}.`
        );
      } else {
        toast(
          result.emailMessage ||
          `Supervisor account processed, but the email to ${result.supervisor.email} could not be sent.`,
          { icon: "⚠️" }
        );
      }

      setSupervisorSuccessModal({
        companyName: company.name,
        supervisorName:
          result.supervisor.name ||
          company.contactPerson ||
          result.supervisor.email,
        supervisorEmail: result.supervisor.email,
        temporaryPassword: undefined,
        emailSent: result.emailSent,
        emailMessage: result.emailMessage,
        wasCreated: result.created,
      });
    } catch (error) {
      console.error("Error creating supervisor account:", error);
      errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "Failed to create supervisor account. Please try again.";
      setSupervisorError({
        companyId: company.id,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setCreatingSupervisorId(null);
    }
  };

  if (loading || (!companies && !moas)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#19191c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          {/* Header Skeleton */}
          <div className="bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
              <div className="flex space-x-3 mt-4 sm:mt-0">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
          <div className="space-y-8">
            {/* Search/Filter Skeleton */}
            <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <div className="flex gap-3">
                  <Skeleton className="h-12 w-40 rounded-xl" />
                  <Skeleton className="h-12 w-32 rounded-xl" />
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-[#212124] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#19191c]">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
        <div className="group relative bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 hover:scale-[1.01] hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Company Management
                  </h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage companies and their Memorandum of Agreement (MOA)
                    documents
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => {
                    resetMOAForm();
                    setShowAddMOA(true);
                  }}
                  className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <FileText className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Add MOA</span>
                </button>
                <button
                  onClick={handleOpenAddCompany}
                  className="group relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Plus className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Add Company</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        <div className="space-y-8">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-[#212124] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search companies, contacts, or MOAs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white text-sm font-medium placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white text-sm font-medium min-w-[140px]"
                  >
                    <option value="all">All Companies</option>
                    <option value="active">Active</option>
                  </select>
                  <select
                    value={moaStatusFilter}
                    onChange={(e) => setMoaStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white text-sm font-medium min-w-[120px]"
                  >
                    <option value="all">All MOAs</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* MOA Alerts */}
          {urgentMOAs.length > 0 ? (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      MOA Alerts
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Monitor urgent MOA activities and deadlines
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {urgentMOAs.map((moa) => (
                    <div
                      key={moa.id}
                      className={`p-4 rounded-xl border-l-4 ${isExpired(moa.uploadedAt)
                        ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                        : "bg-orange-50 dark:bg-orange-900/20 border-orange-500"
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {moa.title} - {moa.student?.company?.name || "Unknown Company"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isExpired(moa.uploadedAt) ? "Expired" : "Expiring soon"} · Uploaded{" "}
                            {moa.uploadedAt ? formatDate(moa.uploadedAt) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            View
                          </button>
                          {!isExpired(moa.uploadedAt) && (
                            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                              Renew
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#212124] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-4 flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    All MOAs are up to date
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No urgent alerts at this time
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Companies with MOAs - Unified Cards */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Companies & MOAs
                </h3>
                <span className="px-2 py-1 bg-gray-100 dark:bg-[#212124] text-gray-600 dark:text-gray-400 text-sm rounded-full">
                  {filteredCompanies.length} companies
                </span>
              </div>
            </div>

            {filteredCompanies.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCompanies.map((company) => {
                  // Get MOAs for this company
                  const companyMOAs = (moas || []).filter(
                    (moa) => moa.student?.company?.id === company.id
                  );
                  const matchedApprovedProposal =
                    approvedProposalLookup.byName.get(
                      normalizeForMatch(company.name)
                    ) ||
                    approvedProposalLookup.byEmail.get(
                      normalizeForMatch(company.contactEmail)
                    ) ||
                    null;

                  const hasApprovedMOA = companyMOAs.some(
                    (moa) => moa.status === "APPROVED"
                  );
                  const hasPendingMOA = companyMOAs.some(
                    (moa) => moa.status === "PENDING"
                  );
                  const hasRejectedMOA =
                    companyMOAs.length > 0 &&
                    companyMOAs.every((moa) => moa.status === "REJECTED");

                  // Check for urgent MOAs (expiring or expired)
                  const companyUrgentMOAs = companyMOAs.filter(
                    (moa) =>
                      isExpiringSoon(moa.uploadedAt) ||
                      isExpired(moa.uploadedAt)
                  );

                  return (
                    <div
                      key={company.id}
                      className="group relative bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
                    >
                      {/* Glass morphism overlay */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/5 dark:from-gray-800/10 dark:via-transparent dark:to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Company Header */}
                      <div className="relative p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        {/* Edit and Delete Buttons - Top Right Corner */}
                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center space-x-1.5 sm:space-x-2 z-10">
                          <button
                            onClick={() => openEditCompany(company)}
                            className="p-1.5 sm:p-2 rounded-lg text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30 bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm"
                            title="Edit Company"
                          >
                            <SquarePen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(company)}
                            disabled={Boolean(
                              company._count?.students &&
                              company._count.students > 0
                            )}
                            className={`p-1.5 sm:p-2 rounded-lg transition-colors bg-white/80 dark:bg-[#212124]/80 backdrop-blur-sm ${company._count?.students &&
                              company._count.students > 0
                              ? "text-red-400/60 cursor-not-allowed"
                              : "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              }`}
                            title={
                              company._count?.students &&
                                company._count.students > 0
                                ? `Cannot delete: ${company._count.students} student(s) assigned`
                                : "Delete Company"
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 sm:gap-4">
                          <div className="md:flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3 space-y-2 sm:space-y-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                                  {company.name}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  {company.contactPerson}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  Slots: {typeof company.maxSlots === "number" ? company.maxSlots : 0}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                  {matchedApprovedProposal && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                      Proposal Approved
                                    </span>
                                  )}
                                  {hasApprovedMOA ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                      MOA Approved
                                    </span>
                                  ) : hasPendingMOA ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                      MOA Pending
                                    </span>
                                  ) : hasRejectedMOA ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                      MOA Rejected
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-[#19191c] dark:text-gray-300">
                                      MOA Not Submitted
                                    </span>
                                  )}
                                </div>
                                {typeof company._count?.students === "number" &&
                                  company._count.students > 0 && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">
                                      {company._count.students} student
                                      {company._count.students !== 1
                                        ? "s"
                                        : ""}{" "}
                                      assigned
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="space-y-1.5 sm:space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <p className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></span>
                                <span className="truncate">{company.contactEmail}</span>
                              </p>
                              <p className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full flex-shrink-0"></span>
                                <span className="truncate">{company.contactNumber}</span>
                              </p>
                              <div className="flex items-start space-x-2">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mt-1 flex-shrink-0"></span>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="block max-w-full text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate"
                                    title={company.address || "No address provided"}
                                  >
                                    {company.address || "No address provided"}
                                  </p>
                                  {company.address && (
                                    <button
                                      type="button"
                                      onClick={() => toast(company.address)}
                                      className="mt-1 text-[10px] sm:text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                      View full address
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {company.supervisor ? (
                              <div className="mt-3 sm:mt-4 w-full rounded-lg border border-green-200 dark:border-green-700 bg-green-50/60 dark:bg-green-900/20 px-3 sm:px-4 py-2 sm:py-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
                                    Supervisor Linked
                                  </p>
                                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-300 shrink-0 ml-2 sm:ml-3" />
                                </div>
                                <div className="mt-1.5 sm:mt-2">
                                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white break-words">
                                    {company.supervisor.name ||
                                      company.supervisor.email}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 break-words">
                                    {company.supervisor.email}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCreateSupervisorAccount(company)}
                                disabled={creatingSupervisorId === company.id}
                                className="mt-3 sm:mt-4 inline-flex w-full items-center justify-center px-3 py-2 text-[10px] sm:text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {creatingSupervisorId === company.id ? (
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                                )}
                                {creatingSupervisorId === company.id
                                  ? "Creating Supervisor..."
                                  : "Create Supervisor Account"}
                              </button>
                            )}
                            {renderSupervisorError(company.id)}
                          </div>
                        </div>
                      </div>

                      {/* MOAs Section */}
                      <div className="p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <h5 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-1.5 sm:space-x-2">
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>MOAs ({companyMOAs.length})</span>
                            {companyUrgentMOAs.length > 0 && (
                              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] sm:text-xs rounded-full">
                                {companyUrgentMOAs.length} urgent
                              </span>
                            )}
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleViewAllCompanyMOAs(company)}
                            className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center space-x-1 disabled:opacity-60 flex-shrink-0"
                            disabled={
                              loadingCompanyMOAs &&
                              companyForMOAModal?.id === company.id
                            }
                          >
                            {loadingCompanyMOAs &&
                              companyForMOAModal?.id === company.id ? (
                              <>
                                <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                                <span>Loading…</span>
                              </>
                            ) : (
                              <span>View All</span>
                            )}
                          </button>
                        </div>

                        {companyMOAs.length > 0 ? (
                          <div className="space-y-2 sm:space-y-3">
                            {companyMOAs.slice(0, 2).map((moa) => {
                              const statusInfo = getStatusInfo(moa.status);
                              const StatusIcon = statusInfo.icon;
                              const isExpiring = isExpiringSoon(moa.createdAt);
                              const isExpiredMOA = isExpired(moa.createdAt);
                              return (
                                <div
                                  key={moa.id}
                                  className={`p-2.5 sm:p-3 rounded-lg border ${isExpiredMOA
                                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                                    : isExpiring
                                      ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"
                                      : "bg-gray-50 dark:bg-[#212124]/50 border-gray-200 dark:border-gray-600"
                                    }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <span
                                          className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusInfo.color} flex-shrink-0`}
                                        >
                                          <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                                          {moa.status}
                                        </span>
                                        {(isExpiring || isExpiredMOA) && (
                                          <span
                                            className={`text-[10px] sm:text-xs ${isExpiredMOA
                                              ? "text-red-600"
                                              : "text-orange-600"
                                              } flex-shrink-0`}
                                          >
                                            {isExpiredMOA
                                              ? "Expired"
                                              : "Expiring"}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {moa.title}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                                        {moa.uploadedAt ? formatDate(moa.uploadedAt) : formatDate(moa.createdAt)}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-1 sm:space-x-1.5">
                                      <button
                                        onClick={() => handlePreviewMOA(moa.id)}
                                        className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        title="Preview MOA"
                                        disabled={previewingMOAId === moa.id}
                                      >
                                        {previewingMOAId === moa.id ? (
                                          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                                        ) : (
                                          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        )}
                                      </button>
                                      {moa.status === "PENDING" && (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleApproveMOA(moa.id)
                                            }
                                            className="p-1 sm:p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                            title="Approve"
                                          >
                                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleRejectMOA(moa.id)
                                            }
                                            className="p-1 sm:p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Reject"
                                          >
                                            <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleDownloadMOA(moa)}
                                        className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        title="Download"
                                        disabled={downloadingMOAId === moa.id}
                                      >
                                        {downloadingMOAId === moa.id ? (
                                          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                                        ) : (
                                          <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {companyMOAs.length > 2 && (
                              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-center py-1.5 sm:py-2">
                                +{companyMOAs.length - 2} more MOAs
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-3 sm:py-4">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-1.5 sm:mb-2" />
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              No MOAs found for this company
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#212124] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-12">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Building2 className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No companies found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Get started by adding your first company to manage
                      internships and MOAs.
                    </p>
                    <button
                      onClick={handleOpenAddCompany}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Your First Company
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add Company Modal */}
          {showAddCompany && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
              style={{ margin: "0" }}
            >
              <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {isEditingCompany ? "Edit Company" : "Add New Company"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddCompany(false);
                      resetCompanyForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmitCompany}
                  className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
                >
                  <div className="space-y-4">
                    {!isEditingCompany && (
                      <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#19191c]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Prefill from Approved Proposal (optional)
                        </label>
                        <select
                          value={selectedApprovedProposalId}
                          onChange={(e) => applyApprovedProposalToCompanyForm(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                        >
                          <option value="">Manual entry</option>
                          {unusedApprovedProposals.map((proposal) => (
                            <option key={proposal.id} value={proposal.id}>
                              {proposal.companyName} - {proposal.student.user.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Selecting an approved proposal auto-fills the company details. You can still edit before saving.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.name}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyForm.contactPerson}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              contactPerson: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                          placeholder="Enter contact person name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Address *
                      </label>
                      <textarea
                        required
                        value={companyForm.address}
                        onChange={(e) =>
                          setCompanyForm((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                        placeholder="Enter company address"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={companyForm.contactEmail}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              contactEmail: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                          placeholder="Enter contact email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Contact Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={companyForm.contactNumber}
                          onChange={(e) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              contactNumber: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                          placeholder="Enter contact number"
                        />
                      </div>
                    </div>

                    {/* Company Type Field */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Company Type *
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="companyType"
                              value="PUBLIC"
                              checked={companyForm.companyType === "PUBLIC"}
                              onChange={(e) => {
                                const newType = e.target.value as "PUBLIC" | "PRIVATE";
                                setCompanyForm((prev) => ({
                                  ...prev,
                                  companyType: newType,
                                  workingDays: newType === "PRIVATE"
                                    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                                    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Public</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="companyType"
                              value="PRIVATE"
                              checked={companyForm.companyType === "PRIVATE"}
                              onChange={(e) => {
                                const newType = e.target.value as "PUBLIC" | "PRIVATE";
                                setCompanyForm((prev) => ({
                                  ...prev,
                                  companyType: newType,
                                  workingDays: newType === "PRIVATE"
                                    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                                    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Private</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Private companies may include Saturday in working days.
                        </p>
                      </div>
                    </div>

                    {/* Working Days Field */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Working Days *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                            <label
                              key={day}
                              className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${companyForm.workingDays.includes(day)
                                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                  : "bg-gray-50 dark:bg-[#212124] border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                } ${companyForm.companyType === "PUBLIC" && (day === "Saturday" || day === "Sunday")
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={companyForm.workingDays.includes(day)}
                                onChange={(e) => {
                                  if (companyForm.companyType === "PUBLIC" && (day === "Saturday" || day === "Sunday")) {
                                    return; // Disable weekends for public companies
                                  }
                                  setCompanyForm((prev) => ({
                                    ...prev,
                                    workingDays: e.target.checked
                                      ? [...prev.workingDays, day]
                                      : prev.workingDays.filter((d) => d !== day),
                                  }));
                                }}
                                disabled={companyForm.companyType === "PUBLIC" && (day === "Saturday" || day === "Sunday")}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                            </label>
                          ))}
                        </div>
                        {companyForm.workingDays.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">At least one working day must be selected</p>
                        )}
                      </div>
                    </div>

                    {/* Capacity Field */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Number of Slots
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          value={companyForm.maxSlots}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (/^\d*$/.test(raw)) {
                              setCompanyForm((prev) => ({
                                ...prev,
                                maxSlots: raw,
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Enter available slots"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Set how many interns this company can accept.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCompany(false);
                        resetCompanyForm();
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingCompany}
                      className="group relative px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      {isAddingCompany ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <div className="flex items-center space-x-2 relative z-10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Adding Company...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <span className="relative z-10">Add Company</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Company MOAs Modal */}
          {showCompanyMOAsModal && companyForMOAModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
              style={{ margin: "0" }}
            >
              <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {companyForMOAModal.name} — MOA Documents
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {companyMOAsSnapshot.length} document
                      {companyMOAsSnapshot.length === 1 ? "" : "s"} found
                    </p>
                  </div>
                  <button
                    onClick={closeCompanyMOAModal}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
                  {companyMOAsSnapshot.map((moa) => {
                    const statusInfo = getStatusInfo(moa.status);
                    const StatusIcon = statusInfo.icon;
                    const isLoadingPreview = previewingMOAId === moa.id;
                    const isLoadingDownload = downloadingMOAId === moa.id;

                    return (
                      <div
                        key={moa.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50/80 dark:bg-[#212124]/60"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {moa.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Uploaded:{" "}
                              {moa.uploadedAt ? formatDate(moa.uploadedAt) : formatDate(moa.createdAt)}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {moa.status}
                              </span>
                              {moa.student?.user?.name && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Student: {moa.student.user.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handlePreviewMOA(moa.id)}
                              className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              disabled={isLoadingPreview}
                            >
                              {isLoadingPreview ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  Loading…
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Preview
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadMOA(moa)}
                              className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              disabled={isLoadingDownload}
                            >
                              {isLoadingDownload ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  Preparing…
                                </>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 mr-1" />
                                  Download
                                </>
                              )}
                            </button>
                            {moa.status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveMOA(moa.id)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectMOA(moa.id)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MOA Preview Modal */}
          {showMOAPreview && selectedMOA && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
              <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    MOA Preview
                  </h3>
                  <button
                    onClick={closePreviewModal}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/20 rounded-lg p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {selectedMOA.title}
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center space-x-2">
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Company:{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {selectedMOA.student?.company?.name || "Unknown Company"}
                                </span>
                              </span>
                            </p>
                            <p className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Uploaded:{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {selectedMOA.uploadedAt ? formatDate(selectedMOA.uploadedAt) : formatDate(selectedMOA.createdAt)}
                                </span>
                              </span>
                            </p>
                            <p className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-green-600" />
                              <span className="text-gray-600 dark:text-gray-400">
                                Status:
                                <span
                                  className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedMOA.status).color
                                    }`}
                                >
                                  {selectedMOA.status}
                                </span>
                              </span>
                            </p>
                            {selectedMOA.uploadedBy && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Uploaded by {selectedMOA.uploadedBy.name} ({selectedMOA.uploadedBy.email})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleDownloadMOA(selectedMOA)}
                            disabled={downloadingMOAId === selectedMOA.id}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {downloadingMOAId === selectedMOA.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Preparing...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </>
                            )}
                          </button>
                          {selectedMOA.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApproveMOA(selectedMOA.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectMOA(selectedMOA.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#212124]/50 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Document Preview
                      </h5>
                      <div className="bg-white dark:bg-[#212124] rounded-lg border border-gray-200 dark:border-gray-600 min-h-[420px] flex items-center justify-center relative overflow-hidden">
                        {previewError ? (
                          <div className="text-center px-6 py-12">
                            <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-sm text-red-500 dark:text-red-400 font-medium">
                              {previewError}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              You can still download the file to view it locally.
                            </p>
                            {selectedMOA && (
                              <button
                                onClick={() => handleDownloadMOA(selectedMOA)}
                                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Document
                              </button>
                            )}
                          </div>
                        ) : previewObjectUrl ? (
                          previewMimeType?.includes("pdf") ? (
                            <iframe
                              title={`Preview ${selectedMOA.title}`}
                              src={previewObjectUrl}
                              className="w-full h-full min-h-[420px]"
                            />
                          ) : (
                            <div className="text-center px-6 py-12">
                              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                In-browser preview is not available for this file
                                type ({previewMimeType || "unknown"}).
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Please download the file to view it.
                              </p>
                              {selectedMOA && (
                                <button
                                  onClick={() => handleDownloadMOA(selectedMOA)}
                                  className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Document
                                </button>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Loading document preview…
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedMOA.description && (
                      <div className="bg-white dark:bg-[#212124] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Description
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedMOA.description}
                        </p>
                      </div>
                    )}

                    {selectedMOA.remarks && (
                      <div className="bg-white dark:bg-[#212124] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Remarks
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedMOA.remarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add MOA Modal */}
          {showAddMOA && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
              <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add New MOA
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddMOA(false);
                      resetMOAForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={handleAddMOA}
                  className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        MOA Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={moaForm.title}
                        onChange={(e) =>
                          setMoaForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                        placeholder="Enter MOA title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={moaForm.description}
                        onChange={(e) =>
                          setMoaForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                        placeholder="Enter MOA description"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company *
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Select the partner company this MOA belongs to.
                      </p>
                      <select
                        required
                        value={moaForm.companyId}
                        onChange={(e) => {
                          const companyId = e.target.value;
                          setMoaForm((prev) => ({
                            ...prev,
                            companyId,
                            studentId: "",
                          }));
                          setSelectedStudentForMOA(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                      >
                        <option value="">Select a company</option>
                        {(companies?.length ?? 0) > 0 ? (
                          (companies ?? []).map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No companies available
                          </option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Student *
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Only students assigned to the selected company are available.
                      </p>
                      <select
                        required
                        value={moaForm.studentId}
                        onChange={(e) => {
                          const studentId = e.target.value;
                          const selectedStudent = filteredStudentsForMOA.find(
                            (s) => s.id === studentId
                          );
                          setSelectedStudentForMOA(selectedStudent ?? null);
                          setMoaForm((prev) => ({
                            ...prev,
                            studentId,
                          }));
                        }}
                        disabled={!moaForm.companyId || filteredStudentsForMOA.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#212124] dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-700/40"
                      >
                        <option value="">
                          {moaForm.companyId
                            ? filteredStudentsForMOA.length > 0
                              ? "Select a student"
                              : "No students assigned to this company yet"
                            : "Select a company first"}
                        </option>
                        {filteredStudentsForMOA.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} ({student.studentNumber}) - {student.company}
                          </option>
                        ))}
                      </select>

                      {selectedCompany && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Selected Company
                            </span>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            {selectedCompany.name}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Contact: {selectedCompany.contactPerson || "N/A"} ({selectedCompany.contactEmail || "N/A"})
                          </p>
                        </div>
                      )}

                      {/* Show selected student's company info */}
                      {selectedStudentForMOA && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Company Assignment
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            <strong>{selectedStudentForMOA.name}</strong> is assigned to{" "}
                            <strong>{selectedStudentForMOA.company}</strong>
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Student ID: {selectedStudentForMOA.studentNumber} | Program:{" "}
                            {selectedStudentForMOA.program}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        MOA Document *
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                        <div className="space-y-1 text-center">
                          <FileText className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white dark:bg-[#212124] rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload a file</span>
                              <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="sr-only"
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOC, DOCX up to 10MB
                          </p>
                          {moaForm.file && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Selected: {moaForm.file.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddMOA(false);
                        resetMOAForm();
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingMOA}
                      className="group relative px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      {isAddingMOA ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <div className="flex items-center space-x-2 relative z-10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading MOA...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <span className="relative z-10">Upload MOA</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Company Confirmation Modal */}
          {showDeleteConfirm && companyToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4" style={{ margin: "0" }}>
              <div className="bg-white dark:bg-[#212124] rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <span>Delete Company</span>
                  </h3>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setCompanyToDelete(null);
                      setDeleteConfirmText("");
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Are you sure you want to delete this company? This action
                      cannot be undone.
                    </p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Company:{" "}
                        <span className="font-bold">
                          {companyToDelete.name}
                        </span>
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Contact: {companyToDelete.contactPerson} (
                        {companyToDelete.contactEmail})
                      </p>
                      {companyToDelete._count?.students &&
                        companyToDelete._count.students > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              ⚠️ This company has{" "}
                              {companyToDelete._count.students} assigned student
                              {companyToDelete._count.students !== 1 ? "s" : ""}
                              . You must unassign all students before deleting
                              the company.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      To confirm deletion, type{" "}
                      <span className="font-mono font-bold text-red-600">
                        delete
                      </span>{" "}
                      in the box below:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-[#212124] dark:text-white"
                      placeholder="Type 'delete' to confirm"
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setCompanyToDelete(null);
                        setDeleteConfirmText("");
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteCompany}
                      disabled={
                        deleteConfirmText !== "delete" ||
                        (companyToDelete._count?.students &&
                          companyToDelete._count.students > 0) ||
                        isDeletingCompany
                      }
                      className={`group relative px-6 py-2 rounded-lg transition-all duration-300 overflow-hidden ${deleteConfirmText === "delete" &&
                        (!companyToDelete._count?.students ||
                          companyToDelete._count.students === 0) &&
                        !isDeletingCompany
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400"
                        }`}
                    >
                      {companyToDelete._count?.students &&
                        companyToDelete._count.students > 0 ? (
                        "Cannot Delete"
                      ) : isDeletingCompany ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <div className="flex items-center space-x-2 relative z-10">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Deleting...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                          <span className="relative z-10">Delete Company</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {supervisorSuccessModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
              <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <CheckCircle className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Supervisor Account {supervisorSuccessModal.wasCreated ? "Created" : "Linked"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {supervisorSuccessModal.companyName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSupervisorSuccessModal(null)}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 px-6 py-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-[#212124]/60">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {supervisorSuccessModal.wasCreated
                        ? "A new supervisor account has been created and linked to this company."
                        : "The supervisor email is now linked to this company."}
                    </p>
                    <p className="mt-3 flex items-center space-x-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      <MailCheck className="h-4 w-4" />
                      <span>
                        {supervisorSuccessModal.emailSent
                          ? supervisorSuccessModal.emailMessage || "Confirmation email sent successfully."
                          : supervisorSuccessModal.emailMessage || "Email notification could not be sent. Please contact support."}
                      </span>
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Supervisor Name
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {supervisorSuccessModal.supervisorName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Supervisor Email
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {supervisorSuccessModal.supervisorEmail}
                      </p>
                    </div>
                    {supervisorSuccessModal.wasCreated && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/30 dark:text-amber-200">
                        Temporary password is sent only via email for security and is hidden in this screen.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-[#212124]/60">
                  <button
                    type="button"
                    onClick={() => setSupervisorSuccessModal(null)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorCompanyManagement;
