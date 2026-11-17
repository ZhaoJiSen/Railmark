package railmark

type Version struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	State       string `json:"state"`
	StartDate   string `json:"startDate"`
	ReleaseDate string `json:"releaseDate"`
	Description string `json:"description"`
}

type Project struct {
	ID          int64       `json:"id"`
	Name        string      `json:"name"`
	Directories []Directory `json:"directories"`
}

type Directory struct {
	ID        int64  `json:"id"`
	ProjectID int64  `json:"projectId"`
	Path      string `json:"path"`
	Remote    string `json:"remote"`
}

type DirectoryPreview struct {
	Path        string `json:"path"`
	Name        string `json:"name"`
	Remote      string `json:"remote"`
	Branch      string `json:"branch"`
	ProjectID   int64  `json:"projectId"`
	DirectoryID int64  `json:"directoryId"`
}

type Requirement struct {
	ID         int64      `json:"id"`
	VersionID  int64      `json:"versionId"`
	Title      string     `json:"title"`
	Direction  string     `json:"direction"`
	State      string     `json:"state"`
	Background string     `json:"background"`
	Scope      string     `json:"scope"`
	Acceptance string     `json:"acceptance"`
	SourceURL  string     `json:"sourceUrl"`
	UpdatedAt  string     `json:"updatedAt"`
	LatestLog  string     `json:"latestLog"`
	Projects   []Delivery `json:"projects"`
}

type Delivery struct {
	DirectoryID int64    `json:"directoryId"`
	ProjectID   int64    `json:"projectId"`
	ProjectName string   `json:"projectName"`
	Path        string   `json:"path"`
	Group       string   `json:"group"`
	State       string   `json:"state"`
	Branch      string   `json:"branch"`
	BaseBranch  string   `json:"baseBranch"`
	PushTarget  string   `json:"pushTarget"`
	Conflicts   []string `json:"conflicts"`
}

type SaveRequirementInput struct {
	ID         int64         `json:"id"`
	VersionID  int64         `json:"versionId"`
	Title      string        `json:"title"`
	Direction  string        `json:"direction"`
	State      string        `json:"state"`
	Background string        `json:"background"`
	Scope      string        `json:"scope"`
	Acceptance string        `json:"acceptance"`
	SourceURL  string        `json:"sourceUrl"`
	Projects   []ProjectLink `json:"projects"`
}

type ProjectLink struct {
	DirectoryID int64  `json:"directoryId"`
	ProjectID   int64  `json:"projectId"`
	ProjectName string `json:"projectName"`
	Path        string `json:"path"`
	Group       string `json:"group"`
	State       string `json:"state"`
	Branch      string `json:"branch"`
	BaseBranch  string `json:"baseBranch"`
	PushTarget  string `json:"pushTarget"`
}

type LogEntry struct {
	ID        int64  `json:"id"`
	Kind      string `json:"kind"`
	Text      string `json:"text"`
	CreatedAt string `json:"createdAt"`
}

type Workspace struct {
	Versions      []Version     `json:"versions"`
	Requirements  []Requirement `json:"requirements"`
	Projects      []Project     `json:"projects"`
	LastVersionID int64         `json:"lastVersionId"`
}

type GitSnapshot struct {
	DirectoryID    int64       `json:"directoryId"`
	CheckedAt      string      `json:"checkedAt"`
	Issue          string      `json:"issue"`
	Branch         string      `json:"branch"`
	Head           string      `json:"head"`
	Upstream       string      `json:"upstream"`
	PushTarget     string      `json:"pushTarget"`
	TrackingKnown  bool        `json:"trackingKnown"`
	Ahead          int         `json:"ahead"`
	Behind         int         `json:"behind"`
	Staged         int         `json:"staged"`
	Unstaged       int         `json:"unstaged"`
	Untracked      int         `json:"untracked"`
	Conflicted     int         `json:"conflicted"`
	Remote         string      `json:"remote"`
	BaseIssue      string      `json:"baseIssue"`
	Commits        []GitCommit `json:"commits"`
	MoreCommits    bool        `json:"moreCommits"`
	HistoryIssue   string      `json:"historyIssue"`
	ReleaseCommits []GitCommit `json:"releaseCommits"`
	ReleaseBase    string      `json:"releaseBase"`
	MoreRelease    bool        `json:"moreRelease"`
	Branches       []GitBranch `json:"branches"`
	BranchesIssue  string      `json:"branchesIssue"`
}

type GitCommit struct {
	Hash     string `json:"hash"`
	FullHash string `json:"fullHash"`
	Date     string `json:"date"`
	Author   string `json:"author"`
	Subject  string `json:"subject"`
	Body     string `json:"body"`
	Parents  string `json:"parents"`
}

type GitBranch struct {
	Ref    string `json:"ref"`
	Name   string `json:"name"`
	Remote bool   `json:"remote"`
}

type GitHistory struct {
	Head    string      `json:"head"`
	Commits []GitCommit `json:"commits"`
	More    bool        `json:"more"`
}
