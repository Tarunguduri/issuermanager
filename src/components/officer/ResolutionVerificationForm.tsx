
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  addAfterImages, 
  compareBeforeAfterImages, 
  updateAIResolutionStatus, 
  updateIssue 
} from '@/utils/issues-service';
import { Loader2, Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import { Issue } from '@/utils/issues-service';

interface ResolutionVerificationFormProps {
  issue: Issue;
  onSuccess?: () => void;
}

const ResolutionVerificationForm: React.FC<ResolutionVerificationFormProps> = ({ 
  issue, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  
  const [images, setImages] = useState<{
    file: File;
    preview: string;
  }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setImages(prev => [...prev, ...newFiles]);
      // Reset verification status when new images are added
      setVerificationStatus(null);
      setVerificationMessage('');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
    // Reset verification status when images are removed
    setVerificationStatus(null);
    setVerificationMessage('');
  };

  const verifyResolution = async () => {
    if (images.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one 'after' image to verify resolution",
        variant: "destructive"
      });
      return;
    }

    if (!issue.beforeImages || issue.beforeImages.length === 0) {
      toast({
        title: "Validation Error",
        description: "No 'before' images available for comparison",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('pending');

    try {
      // In a real app, this would be a real comparison of actual image URLs
      // For demo, we'll use the mock implementation
      const beforeImageUrl = issue.beforeImages[0];
      const afterImageUrl = images[0].preview;
      
      const result = await compareBeforeAfterImages(beforeImageUrl, afterImageUrl);
      
      setVerificationStatus(result.resolved ? 'verified' : 'rejected');
      setVerificationMessage(result.message);
      
      if (result.resolved) {
        toast({
          title: "Verification Successful",
          description: "AI has verified that the issue has been resolved",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "AI could not verify resolution. Please check the details and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Verification Error",
        description: "Failed to verify resolution. Please try again.",
        variant: "destructive"
      });
      setVerificationStatus(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (images.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one 'after' image",
        variant: "destructive"
      });
      return;
    }
    
    if (verificationStatus !== 'verified') {
      toast({
        title: "Verification Required",
        description: "Please verify the resolution before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, we'd upload the images to storage and get URLs
      // For this demo, we'll use the file names as image URLs
      const imageNames = images.map(img => img.file.name);
      
      // Add the after images to the issue
      await addAfterImages(issue.id, imageNames);
      
      // Update AI resolution status
      await updateAIResolutionStatus(issue.id, 'verified');
      
      // Mark the issue as resolved
      await updateIssue(issue.id, {
        status: 'resolved',
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Success",
        description: "Issue resolution has been verified and issue marked as resolved"
      });
      
      // Clean up image previews
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      setVerificationStatus(null);
      setVerificationMessage('');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to submit resolution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassmorphicCard className="p-6">
      <h3 className="text-lg font-semibold mb-4">Verify Issue Resolution</h3>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Before Images</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {issue.beforeImages && issue.beforeImages.map((image, index) => (
            <div 
              key={`before-${index}`}
              className="aspect-square rounded-md overflow-hidden border border-border"
            >
              <img
                src={image}
                alt={`Before ${index}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>After Images (Required)</Label>
            {verificationStatus && (
              <div className={`flex items-center text-sm ${
                verificationStatus === 'verified' 
                  ? 'text-green-500' 
                  : verificationStatus === 'rejected' 
                    ? 'text-red-500' 
                    : 'text-amber-500'
              }`}>
                {verificationStatus === 'verified' && (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    <span>Resolution Verified</span>
                  </>
                )}
                {verificationStatus === 'rejected' && (
                  <>
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Resolution Not Verified</span>
                  </>
                )}
                {verificationStatus === 'pending' && (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span>Verifying...</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative group aspect-square rounded-md overflow-hidden border ${
                    verificationStatus === 'verified' 
                      ? 'border-green-400' 
                      : verificationStatus === 'rejected'
                        ? 'border-red-400' 
                        : 'border-border'
                  }`}
                >
                  <img
                    src={image.preview}
                    alt={`After ${index}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
          
          {verificationMessage && (
            <div className={`p-3 rounded-md text-sm ${
              verificationStatus === 'verified' 
                ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}>
              {verificationMessage}
            </div>
          )}
          
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="resolution-file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-1 text-sm text-muted-foreground">
                  <span className="font-medium">Upload 'after' images</span> showing the resolved issue
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or JPEG (MAX. 10MB)
                </p>
              </div>
              <input
                id="resolution-file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              onClick={verifyResolution}
              disabled={isVerifying || images.length === 0}
              className="w-full sm:w-1/2"
              variant="outline"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Resolution...
                </>
              ) : (
                'Verify Resolution with AI'
              )}
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || verificationStatus !== 'verified'}
              className="w-full sm:w-1/2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit & Resolve Issue'
              )}
            </Button>
          </div>
        </div>
      </form>
    </GlassmorphicCard>
  );
};

export default ResolutionVerificationForm;
