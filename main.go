package main

import (
	"context"
	"fmt"
	"log"
	"path/filepath"

	"github.com/egoist/mygo"

	"railmark/internal/railmark"
)

func main() {
	service := &Desk{}
	mygo.Bind(service)
	mygo.App.WhenReady(func() {
		data, err := mygo.App.Path(mygo.PathUserData)
		if err == nil {
			service.store, err = railmark.Open(filepath.Join(data, "railmark.sqlite3"))
		}
		if err != nil {
			log.Fatal(fmt.Errorf("无法打开 Railmark 数据：%w", err))
		}
		if mode, err := service.store.Appearance(context.Background()); err == nil {
			mygo.Theme.SetSource(mygo.ThemeSource(mode))
		} else {
			log.Printf("读取外观偏好：%v", err)
		}
		mygo.App.OnQuit(func() { _ = service.store.Close() })
		mygo.NewWindow(mygo.WindowOptions{
			Title: "Railmark", URL: "/", Width: 1180, Height: 810,
			MinWidth: 840, MinHeight: 590, StateKey: "workspace",
			TitleBarStyle:        mygo.TitleBarHiddenInset,
			TrafficLightPosition: &mygo.Point{X: 17, Y: 17},
		})
	})
	if err := mygo.App.Run(); err != nil {
		log.Fatal(err)
	}
}
