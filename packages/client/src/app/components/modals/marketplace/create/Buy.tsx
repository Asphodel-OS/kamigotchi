import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatUnits, parseEther } from 'viem';

import placeholderKami from 'assets/images/kamis/placeholderKami.gif';
import { MenuIcons } from 'assets/images/icons/menu';
import { TokenIcons } from 'assets/images/tokens';
import type { BaseKami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';
import { ExpirySlider } from './ExpirySlider';

type BidMode = 'generic' | 'specific';

export const Buy = ({
  isVisible,
  quantity,
  setQuantity,
  price,
  setPrice,
  expiration,
  setExpiration,
  searchKamis,
  selectedBuyKami,
  onSelectBuyKami,
  onClearBuyKami,
}: {
  isVisible: boolean;
  quantity: string;
  setQuantity: (val: string) => void;
  price: string;
  setPrice: (val: string) => void;
  expiration: number;
  setExpiration: (val: number) => void;
  searchKamis: (term: string) => BaseKami[];
  selectedBuyKami: BaseKami | null;
  onSelectBuyKami: (kami: BaseKami) => void;
  onClearBuyKami: () => void;
}) => {
  const [bidMode, setBidMode] = useState<BidMode>('generic');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BaseKami[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number; width: number } | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(() => {
      const results = searchKamis(searchTerm);
      setSearchResults(results);
      setHasSearched(true);
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (showResults && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.top, width: rect.width });
    }
  }, [showResults, searchResults]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const blurTimerRef = useRef<number>();

  useEffect(() => {
    return () => clearTimeout(blurTimerRef.current);
  }, []);

  const handleBlur = () => {
    blurTimerRef.current = window.setTimeout(() => {
      const active = document.activeElement;
      const inSearch = searchRef.current?.contains(active);
      const inResults = resultsRef.current?.contains(active);
      if (!inSearch && !inResults) setShowResults(false);
    }, 150);
  };

  const handleSelect = (kami: BaseKami) => {
    playClick();
    onSelectBuyKami(kami);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setHasSearched(false);
  };

  const handleModeSwitch = (mode: BidMode) => {
    if (mode === bidMode) return;
    playClick();
    setPrice('');
    if (mode === 'generic') {
      onClearBuyKami();
      setQuantity('5');
    } else {
      setQuantity('');
    }
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setHasSearched(false);
    setBidMode(mode);
  };

  const perKamiDisplay = useMemo(() => {
    if (!price || !quantity) return null;
    const qty = Number(quantity);
    if (qty <= 0) return null;
    try {
      const totalWei = parseEther(price);
      const perKamiWei = totalWei / BigInt(qty);
      const num = Number(formatUnits(perKamiWei, 18));
      if (num > 0 && num < 0.000001) return '<0.000001';
      return num.toFixed(6).replace(/\.?0+$/, '');
    } catch {
      return null;
    }
  }, [price, quantity]);

  return (
    <Conditional isVisible={isVisible}>
      <MainLayout>
        <BidTypeColumn>
          <BidTypeTitle>Bid Type</BidTypeTitle>
          <BidTypeRow>
            <BidTypeOption
              $active={bidMode === 'generic'}
              onClick={() => handleModeSwitch('generic')}
            >
              <BidTypeImage src={placeholderKami} alt='Generic' />
              <BidTypeLabel>Generic</BidTypeLabel>
            </BidTypeOption>
            <BidTypeOption
              $active={bidMode === 'specific'}
              onClick={() => handleModeSwitch('specific')}
            >
              <BidTypeImage
                src={selectedBuyKami?.image ?? MenuIcons.kami}
                alt='Specific'
                $isIcon={!selectedBuyKami}
              />
              <BidTypeLabel>Specific</BidTypeLabel>
            </BidTypeOption>
          </BidTypeRow>
        </BidTypeColumn>

        <VerticalDivider />

        <FieldsColumn>
          {bidMode === 'generic' && (
            <>
              <FieldGroup>
                <SectionLabel>Quantity</SectionLabel>
                <InputRow>
                  <StyledInput
                    type='text'
                    inputMode='numeric'
                    placeholder='Enter Amount'
                    value={quantity}
                    onFocus={(e) => { playClick(); e.currentTarget.select(); setQuantity(''); }}
                    onBlur={() => { if (!quantity) setQuantity('5'); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        val = val.replace(/^0+/, '');
                        if (val === '') return;
                        if (Number(val) > 30) setQuantity('30');
                        else setQuantity(val);
                      }
                    }}
                  />
                  <InputIcon src={MenuIcons.kami} alt='Kami' />
                </InputRow>
              </FieldGroup>
              <FieldRow>
                <RowFieldGroup>
                  <SectionLabel>Total Bid</SectionLabel>
                  <TotalBidRow>
                    <InputRow>
                      <StyledInput
                        type='text'
                        inputMode='decimal'
                        placeholder='Enter Bid'
                        value={price}
                        onFocus={() => playClick()}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val === '' || /^\d*\.?\d{0,6}$/.test(val)) {
                            if (val !== '' && Number(val) > 100) return;
                            val = val.replace(/^0+(\d)/, '$1');
                            setPrice(val);
                          }
                        }}
                        onBlur={() => {
                          if (price === '') return;
                          let val = price;
                          if (Number(val) > 0 && Number(val) < 0.001) val = '0.001';
                          if (val.includes('.')) val = val.replace(/0+$/, '').replace(/\.$/, '');
                          if (val !== price) setPrice(val);
                        }}
                      />
                      <InputIcon src={TokenIcons.eth} alt='ETH' />
                    </InputRow>
                    <PerKamiChip>
                      <PerKamiLabel>Per Kami:</PerKamiLabel>
                      <PerKamiIcon src={TokenIcons.eth} alt='ETH' />
                      <PerKamiValue>{perKamiDisplay ?? '—'}</PerKamiValue>
                    </PerKamiChip>
                  </TotalBidRow>
                </RowFieldGroup>
                <RowFieldGroup>
                  <SectionLabel>Choose Expiration</SectionLabel>
                  <ExpirySlider expirationHours={expiration} setExpirationHours={setExpiration} />
                </RowFieldGroup>
              </FieldRow>
            </>
          )}

          {bidMode === 'specific' && (
            <>
              <FieldGroup>
                <SectionLabel>Select Kami</SectionLabel>
                {selectedBuyKami ? (
                  <SelectedRow>
                    <SelectedImage src={selectedBuyKami.image} />
                    <SelectedName>{selectedBuyKami.name}</SelectedName>
                    <ClearSearchButton onClick={() => { playClick(); onClearBuyKami(); setSearchTerm(''); }}>×</ClearSearchButton>
                  </SelectedRow>
                ) : (
                  <SearchWrapper ref={searchRef} onBlur={handleBlur}>
                    <KamiSearchInput
                      ref={inputRef}
                      type='text'
                      placeholder='Name or #index'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => { playClick(); if (hasSearched) setShowResults(true); }}
                    />
                    {showResults && dropdownPos && (searchResults.length > 0 || hasSearched) && (
                      <ResultsList
                        ref={resultsRef}
                        style={{
                          position: 'fixed',
                          left: dropdownPos.left,
                          bottom: window.innerHeight - dropdownPos.top,
                          width: dropdownPos.width,
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {searchResults.length > 0 ? (
                          <>
                            {searchResults.map((kami) => (
                              <ResultItem key={kami.entity} onClick={() => handleSelect(kami)}>
                                <ResultImage src={kami.image} />
                                <ResultName>{kami.name}</ResultName>
                                <ResultIndex>#{kami.index}</ResultIndex>
                              </ResultItem>
                            ))}
                            {searchResults.length >= 20 && (
                              <ResultsHint>Refine your search for more results</ResultsHint>
                            )}
                          </>
                        ) : (
                          <ResultsHint>No kamis found</ResultsHint>
                        )}
                      </ResultsList>
                    )}
                  </SearchWrapper>
                )}
              </FieldGroup>
              <FieldRow>
                <RowFieldGroup>
                  <SectionLabel>Bid Amount</SectionLabel>
                  <InputRow>
                    <StyledInput
                      type='text'
                      inputMode='decimal'
                      placeholder='Enter Bid'
                      value={price}
                      onFocus={() => playClick()}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d{0,6}$/.test(val)) {
                          if (val !== '' && Number(val) > 100) return;
                          setPrice(val);
                        }
                      }}
                      onBlur={() => {
                        if (price === '') return;
                        let val = price;
                        if (Number(val) > 0 && Number(val) < 0.001) val = '0.001';
                        if (val.includes('.')) val = val.replace(/0+$/, '').replace(/\.$/, '');
                        if (val !== price) setPrice(val);
                      }}
                    />
                    <InputIcon src={TokenIcons.eth} alt='ETH' />
                  </InputRow>
                </RowFieldGroup>
                <RowFieldGroup>
                  <SectionLabel>Choose Expiration</SectionLabel>
                  <ExpirySlider expirationHours={expiration} setExpirationHours={setExpiration} />
                </RowFieldGroup>
              </FieldRow>
            </>
          )}
        </FieldsColumn>
      </MainLayout>
    </Conditional>
  );
};

const Conditional = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `` : `display: none;`)}
`;

const MainLayout = styled.div`
  display: flex;
  padding: 0.5vw 0.6vw;
  gap: 0;
`;

const BidTypeColumn = styled.div`
  flex: 0 0 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3vw;
  padding-right: 0.5vw;
`;

const BidTypeTitle = styled.span`
  font-weight: bold;
  font-size: 0.8vw;
  padding-bottom: 0.2vw;
  border-bottom: 0.08vw solid #ddd;
`;

const BidTypeRow = styled.div`
  display: flex;
  gap: 0.3vw;
  width: 100%;
`;

const BidTypeOption = styled.div<{ $active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15vw;
  cursor: pointer;
  padding: 0.15vw 0.15vw 0.2vw;
  border-radius: 0.4vw;
  border: 0.15vw solid ${({ $active }) => ($active ? '#7aa8d4' : '#ddd')};
  background: ${({ $active }) => ($active ? '#E0EEFF' : '#f0f0f0')};
  opacity: ${({ $active }) => ($active ? 1 : 0.5)};
  transition: all 0.15s;
  overflow: hidden;

  &:hover {
    opacity: 1;
  }
`;

const BidTypeImage = styled.img<{ $isIcon?: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 0.25vw;
  image-rendering: pixelated;
  object-fit: ${({ $isIcon }) => ($isIcon ? 'contain' : 'cover')};
  padding: ${({ $isIcon }) => ($isIcon ? '15%' : '0')};
  background: white;
`;

const BidTypeLabel = styled.span`
  font-size: 0.55vw;
  font-weight: 600;
  color: #555;
`;

const VerticalDivider = styled.div`
  width: 0.08vw;
  background: #ddd;
  align-self: stretch;
`;

const FieldsColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  padding-left: 0.6vw;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3vw;
`;

const FieldRow = styled.div`
  display: flex;
  gap: 0.8vw;
  flex-wrap: wrap;
`;

const RowFieldGroup = styled(FieldGroup)`
  flex: 1;
  min-width: 12vw;
`;

const SectionLabel = styled.div`
  font-weight: bold;
  font-size: 0.8vw;
  padding-bottom: 0.2vw;
  border-bottom: 0.08vw solid #ddd;
`;

const TotalBidRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
`;

const StyledInput = styled.input`
  font-size: 1vw;
  width: 10vw;
  height: 2.5vw;
  padding: 0.3vw 0.6vw;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  outline: none;
  background: white;
  text-align: center;
  caret-color: transparent;
  cursor: pointer;

  &::placeholder {
    color: transparent;
    font-size: 0.8vw;
  }

  &:focus {
    border-width: 0.25vw;
    background: #FFF9E0;
  }

  &:focus::placeholder {
    color: #aaa;
  }

  &:disabled {
    background: #e9e9e9;
    color: #666;
    cursor: not-allowed;
  }
`;

const InputIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const PerKamiChip = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25vw;
  padding: 0.3vw 0.5vw;
  border-radius: 0.3vw;
  background: #f0f4f0;
  border: 0.06vw solid #d0d8d0;
  width: fit-content;
`;

const PerKamiLabel = styled.span`
  font-size: 0.7vw;
  color: #666;
`;

const PerKamiIcon = styled.img`
  width: 0.9vw;
  height: 0.9vw;
`;

const PerKamiValue = styled.span`
  font-size: 0.75vw;
  font-weight: 700;
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const KamiSearchInput = styled.input`
  font-size: 1vw;
  width: 50%;
  height: 2.5vw;
  padding: 0.3vw 0.6vw;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  outline: none;
  background: white;
  text-align: center;
  caret-color: transparent;
  cursor: pointer;

  &::placeholder {
    color: transparent;
    font-size: 0.8vw;
  }

  &:focus {
    border-width: 0.25vw;
    background: #FFF9E0;
  }

  &:focus::placeholder {
    color: #aaa;
  }
`;

const ResultsList = styled.div`
  max-height: 15vw;
  overflow-y: auto;
  background: white;
  border: 0.15vw solid #ccc;
  border-bottom: none;
  border-radius: 0.4vw 0.4vw 0 0;
  z-index: 9999;
`;

const ResultItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  padding: 0.3vw 0.5vw;
  cursor: pointer;

  &:hover {
    background: #f0f4f8;
  }
`;

const ResultImage = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  border-radius: 0.2vw;
  image-rendering: pixelated;
  object-fit: cover;
`;

const ResultName = styled.span`
  font-size: 0.8vw;
  flex: 1;
`;

const ResultIndex = styled.span`
  font-size: 0.7vw;
  color: #888;
`;

const ResultsHint = styled.div`
  padding: 0.4vw 0.5vw;
  font-size: 0.7vw;
  color: #999;
  text-align: center;
`;

const SelectedRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.3vw;
  background: #f8f8f8;
  border-radius: 0.4vw;
  border: 0.15vw solid #ddd;
  width: 50%;
`;

const SelectedImage = styled.img`
  width: 2.2vw;
  height: 2.2vw;
  border-radius: 0.3vw;
  image-rendering: pixelated;
  object-fit: cover;
`;

const SelectedName = styled.span`
  font-weight: bold;
  font-size: 0.8vw;
  color: #222;
`;

const ClearSearchButton = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.1vw;
  cursor: pointer;
  color: #888;
  padding: 0 0.3vw;
  display: flex;
  align-items: center;
  align-self: center;

  &:hover {
    color: #333;
  }
`;
