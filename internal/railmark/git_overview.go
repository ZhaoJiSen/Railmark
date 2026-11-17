package railmark

import (
	"context"
	"sync"
)

func (s *Store) GitOverview(ctx context.Context, versionID int64) ([]GitSnapshot, error) {
	dirs, err := readRows(ctx, s.db, scanDirectory, `SELECT DISTINCT dir.id, dir.project_id, dir.path, dir.remote
        FROM directories dir JOIN deliveries d ON d.directory_id=dir.id
        JOIN requirements r ON r.id=d.requirement_id WHERE r.version_id=?`, versionID)
	if err != nil {
		return nil, err
	}
	result := make([]GitSnapshot, len(dirs))
	var wg sync.WaitGroup
	size := min(len(dirs), 4)
	jobs := make(chan int)
	for range size {
		wg.Go(func() {
			for i := range jobs {
				result[i] = InspectGit(ctx, dirs[i], "", false)
			}
		})
	}
	for i := range dirs {
		jobs <- i
	}
	close(jobs)
	wg.Wait()
	return result, ctx.Err()
}
