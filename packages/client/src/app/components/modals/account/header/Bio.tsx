import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionIcons } from 'assets/images/icons/actions';
import { Account } from 'network/shapes';
import { playScribble } from 'utils/sounds';

export const Bio = ({
  account,
  actions,
  isSelf,
}: {
  account: Account;
  actions: { setBio: (bio: string) => void };
  isSelf: boolean;
}) => {
  const { setBio } = actions;

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(account.bio || '');

  const rowRef = useRef<HTMLDivElement>(null);
  const bioTextAreaRef = useRef<HTMLTextAreaElement>(null);

  ///////////////
  // USEEFFECT
  useEffect(() => {
    setBioText(account.bio || '');
  }, [account.bio]);

  // bio is saved when clicking outside of the detailrow area or when enter is pressed
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingBio && rowRef.current && !rowRef.current.contains(event.target as Node)) {
        handleSetBio();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditingBio]);

  // adjusts the textarea height when the bio changes/ window resizes
  useEffect(() => {
    const handleResize = () => {
      const textarea = bioTextAreaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        //  update height if it's different (to avoid rerenders)
        if (textarea.style.height !== scrollHeight + 'px') {
          textarea.style.height = scrollHeight + 'px';
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bioText, isEditingBio]);

  ///////////////
  // HANDLERS
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBioText(value.trim() ? value : '');
  };

  const handleSetBio = () => {
    setBio(bioText);
    playScribble();
    setIsEditingBio(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isEditingBio && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSetBio();
    }
  };

  const getPlaceholder = () => {
    return bioText?.trim() ? '' : isSelf ? 'Add a bio...' : 'No bio yet...';
  };

  ///////////////
  // RENDER
  return (
    <DetailRow ref={rowRef} style={{ position: 'relative', width: '100%' }}>
      <TextArea
        lang='en'
        ref={bioTextAreaRef}
        placeholder={getPlaceholder()}
        value={bioText}
        isEditing={isEditingBio}
        onChange={handleBioChange}
        readOnly={!isEditingBio}
        maxLength={140}
        onClick={() => isSelf && setIsEditingBio(true)}
        onKeyDown={handleKeyDown}
        isSelf={isSelf}
      />
      {isSelf && <LetterCount>{bioText.length}/140</LetterCount>}
      {!isEditingBio && isSelf && <EditIcon src={ActionIcons.edit} />}
    </DetailRow>
  );
};

const DetailRow = styled.div`
  padding: 0.15vw 0;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
`;

// important to pass lang='en' to textarea,if not  hyphenation wont work
const TextArea = styled.textarea<{ isEditing: boolean; isSelf: boolean }>`
  ${({ isEditing }) => `
    background-color: ${isEditing ? '#fff' : '#f3f3f3'};
    color: ${isEditing ? '#000' : '#444'};
  `}
  ${({ isSelf }) => `
    border: ${isSelf ? '1px solid #ccc' : 'none'};
  `}
  cursor: ${({ isEditing, isSelf }) => (!isEditing && isSelf ? 'pointer' : 'auto')};
  &:focus {
    border-color: ${({ isSelf }) => (isSelf ? '#000' : 'none')};
    box-shadow: ${({ isSelf }) => (isSelf ? '0 0 2px 1px rgba(0, 0, 0, 0.3)' : 'none')};
  }
  resize: none;
  overflow: hidden;
  width: 100%;
  padding: 0.6vw 0.6vw 1.3vw 0.6vw;
  border-radius: 0.6vw;
  min-height: 4vw;
  font-size: 0.7vw;
  line-height: 1.2vw;
  text-align: justify;
  outline: none;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
`;

const LetterCount = styled.div`
  position: absolute;
  left: 0.6vw;
  bottom: 0.7vw;
  color: grey;
  font-size: 0.5vw;
`;

const EditIcon = styled.img`
  position: absolute;
  right: 0.6vw;
  bottom: 0.6vw;
  height: min(1.4vh, 1.4vw);
  pointer-events: none;
  opacity: 0.6;
`;
