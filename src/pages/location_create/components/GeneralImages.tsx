import { FC, ChangeEvent, useState, useEffect } from 'react';
import { MAX_FILE_SIZE, sectionStyle } from '../styles';
import { handleImageRemoval, type ImageHandlerState } from '../utils';

export const GeneralImages: FC = () => {
  const [state, setState] = useState<ImageHandlerState>({
    imagePreview: [],
    files: []
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (!newFiles) return;

    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        e.target.value = '';
        setState({ imagePreview: [], files: [] });
        return;
      }
    }

    // Store files and create preview URLs
    const filesArray = Array.from(newFiles);
    const imageUrls = filesArray.map(file => URL.createObjectURL(file));
    setState({ 
      files: filesArray,
      imagePreview: imageUrls 
    });
  };

  const removeImage = (indexToRemove: number) => {
    handleImageRemoval(indexToRemove, state, 'images', setState);
  };

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      state.imagePreview.forEach(URL.revokeObjectURL);
    };
  }, [state.imagePreview]);

  return (
    <div style={sectionStyle}>
      <h4>Immagini generali (15MB MAX per ogni immagine)</h4>
      <input
        type="file"
        name="images"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        required
      />
      
      {state.imagePreview.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
          {state.imagePreview.map((url, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <img 
                src={url}
                alt={`Preview ${index + 1}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 