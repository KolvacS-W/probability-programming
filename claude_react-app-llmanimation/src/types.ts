// src/types.ts

export interface KeywordNode {
    keyword: string;
    children: KeywordNode[];
    subKeywords: string[];
    codeBlock: string; // Add codeBlock to store the code block for this keyword
    parentKeyword: string | null; // Add parentKeyword to trace the parent keyword
  }
  
  export interface KeywordTree {
    level: number;
    keywords: KeywordNode[];
  }

  export interface Version {
    id: string;
    description: string;
    savedOldDescription: string; // to track the old description to call descriptionupdate
    backendcode: { html: string }; //backend hidden
    usercode: { js: string } //user use
    savedOldCode: { html: string; css: string; js: string }; // to track the old code to call codeupdate
    keywordTree: KeywordTree[];
    wordselected: string;
    highlightEnabled: boolean;
    loading: boolean;
    piecesToHighlightLevel1: string[];
    piecesToHighlightLevel2: string[];
    showDetails: { [word: string]: boolean };
    latestDescriptionText: string; // to track latest description when being edited
    hiddenInfo: string[];
    formatDescriptionHtml: string; // descriptiontext with html format
    specificParamList: string[]; // 
    paramCheckEnabled: boolean;  // 
    history?: Version;  // Added for undo functionality
    detailtargetext?: string[],
    reuseableSVGElementList: { codeName: string, codeText: string, selected: boolean }[];
    modifyPieceList: { codeName: string, pieces: [], pieceprompts: []}[];
    AnnotatedPieceList: { codeName: string, pieces: [], groupname: ''}[];
    highlightedSVGPieceList?: { codeName: string, codeText: string, selected: boolean }[];//only highlighted, use to maintain highlight info
    previousSelectedSVGPieceList: { codeName: string, codeText: string, selected: boolean, parentSVG: string }[];//all ever selected, use to query when modifying 
    storedcoordinate?: { x: number, y: number };
    cachedobjectslog: Record<string, any>;
  }
  
  
  
  