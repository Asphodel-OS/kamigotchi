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
  padding: 0.15em 0;
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
  padding: 0.6em 0.6em 1.3em 0.6em;
  border-radius: 0.6em;
  min-height: 4em;
  font-size: 0.7em;
  line-height: 1.2em;
  text-align: justify;
  outline: none;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
`;

const LetterCount = styled.div`
  position: absolute;
  left: 0.6em;
  bottom: 0.7em;
  color: grey;
  font-size: 0.5em;
`;

const EditIcon = styled.img`
  position: absolute;
  right: 0.6em;
  bottom: 0.6em;
  height: min(1.4em, 1.4em);
  pointer-events: none;
  opacity: 0.6;
`;
