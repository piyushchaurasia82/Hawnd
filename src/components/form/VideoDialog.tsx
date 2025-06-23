interface VideoDialogProps {
    isOpen: boolean;
    videoUrl: string;
    onClose: () => void;
}

const VideoDialog = ({ isOpen, videoUrl, onClose }: VideoDialogProps ) => {
    // Close the dialog if the video URL is empty
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Video Player</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
                <div className="aspect-w-16 aspect-h-9">
                    <video
                        controls
                        autoPlay
                        className="w-full h-full"
                        src={videoUrl}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
};

export default VideoDialog;
