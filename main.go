package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/egoist/mygo"

	"railmark/internal/automation"
	"railmark/internal/railmark"
)

func main() {
	if len(os.Args) == 3 && os.Args[1] == "--railmark-automation-files" {
		if err := automation.ServeFiles(os.Args[2], os.Stdin, os.Stdout); err != nil {
			os.Exit(1)
		}
		return
	}
	service := &Desk{}
	generate := os.Getenv("MYGO_GENERATE")
	if generate == "" || filepath.Base(generate) != "mygo-automation.ts" {
		mygo.Bind(service)
	}
	if generate == "" || filepath.Base(generate) == "mygo-automation.ts" {
		mygo.Bind(&Automation{desk: service})
	}
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
