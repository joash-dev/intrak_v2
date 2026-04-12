import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { FILE_UNAVAILABLE_TRY_AGAIN_MESSAGE } from '../../constants/storageMessages';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Use CDN for worker to avoid build/bundling issues with Vite/Rollup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string | null;
}

const PDFViewer = ({ url }: PDFViewerProps) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const [basePageWidth, setBasePageWidth] = useState<number>(800);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    };

    const previousPage = () => {
        changePage(-1);
    };

    const nextPage = () => {
        changePage(1);
    };

    useEffect(() => {
        const updateWidth = () => {
            const container = canvasContainerRef.current;
            if (!container) return;
            // Keep a little breathing room inside the scroller on small screens.
            const availableWidth = Math.max(220, container.clientWidth - 24);
            setBasePageWidth(Math.min(900, availableWidth));
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    if (!url) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Controls Toolbar */}
            <div className="flex flex-col gap-2 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="text-xs sm:text-sm font-medium w-12 text-center text-gray-700 dark:text-gray-200">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title="Rotate"
                    >
                        <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-3">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={previousPage}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="hidden sm:inline text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Page {pageNumber} of {numPages || '--'}
                    </span>
                    <span className="sm:hidden text-xs text-gray-600 dark:text-gray-400 font-medium">
                        Pg {pageNumber}/{numPages || '--'}
                    </span>
                    <button
                        disabled={pageNumber >= (numPages || 1)}
                        onClick={nextPage}
                        className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* PDF Canvas */}
            <div ref={canvasContainerRef} className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex justify-center p-2 sm:p-4">
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center p-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    }
                    error={
                        <div className="flex flex-col items-center justify-center p-10 text-amber-700 dark:text-amber-400 max-w-md text-center">
                            <p className="font-semibold">Could not open this PDF.</p>
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{FILE_UNAVAILABLE_TRY_AGAIN_MESSAGE}</p>
                        </div>
                    }
                    className="shadow-xl"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={Math.max(220, Math.floor(basePageWidth * scale))}
                        rotate={rotation}
                        className="bg-white"
                        loading={
                            <div className="h-[600px] w-[400px] bg-white animate-pulse rounded-lg"></div>
                        }
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                    />
                </Document>
            </div>
        </div>
    );
};

export default PDFViewer;
