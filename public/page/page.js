(function(){
    /* Guide:
     * 
     * body:
     *     page-main = #id of main content
     *     page-panel-left = #id of left panel
     *     page-panel-right = #id of right panel
     *     page-topbar = #id of topbar
     * 
     * main:
     *     class:
     *         page-main
     *     attrs:
     *         page-tabbed = #id of nav
     * 
     * topbar:
     *     class:
     *         page-topbar
     *     attrs:
     *         yield = 'left,right'
     *     
     * panels:
     *     class:
     *         page-panel-left | page-panel-right | page-panel-bottom
     *     attrs:
     *         hide-toggle = #id of toggle element (either input[type='checkbox'] or label)
     *         page-panel = 'fixed' | 'flex'
     *         pct = percentage value (only if page-panel='flex')
     */
    function addEvent(e,event,fn,capture) {
        if (e.attachEvent) e.attachEvent('on'+event,fn);
		else e.addEventListener(event,fn,!!capture);
    }
    
    

    var setupTabbed = (function(){
        function changeTab(event) {
            if (event.target.name !== 'tab') return;
            let active = event.target.form.elements.namedItem('active_tab');
            document.getElementById(active.value).classList.toggle('active',false);
            active.value = event.target.value;
            document.getElementById(event.target.value).classList.toggle('active',true);
        }
        return function(tabs) {
            // tabs must be container element for all tabs, and must have an attribute page-tabbed='#id_of_nav'
            let navid = tabs.getAttribute('page-tabbed'),navform = document.forms[navid];
            if (navform === undefined) {
                console.warn("Could not set up tabs: tab nav form with id " + navid + " does not exist in document");
                return;
            }
            let tradio = navform.elements.namedItem('tab');
            if (tradio === null) {
                console.warn("Could not set up tabs: nav form does not contain tradio element with name 'tab'");
                return;
            }
            var active_tab = navform.elements.namedItem("active_tab");
            if (active_tab===null) {
                // create active_tab hidden input -> <input type='hidden' name='active_tab' value='tables'/>
                active_tab = document.createElement('input');
                active_tab.setAttribute("type",'hidden');
                active_tab.setAttribute("name","active_tab");
                if (!tradio.value) {
                    tradio[0].checked = true;
                }
                active_tab.value = tradio.value;
                navform.appendChild(active_tab);
            } else if (!active_tab.value || Array.prototype.findIndex.call(tradio,e => e.value==active_tab.value) < 0) {
                if (!tradio.value) tradio[0].checked = true;
                active_tab.value = tradio.value;
            } else {
                tradio.value = active_tab.value;
            }
            document.getElementById(tradio.value).classList.toggle('active',true);
            addEvent(navform,'change',changeTab);
        }
    }());
    
    var setupTopBar = (function() {
        function configureYieldLeft(main,bar,lctrl,lyield) {
            if (lctrl === null) return;
            let lpanel = document.getElementById(lctrl.value);
            if (!lyield) {
                lpanel.style.top = main.style.top;
                return
            }
            bar.style.left = main.style.left;
            addEvent(lctrl,'change',function(panel,event) {
                this.style.left = event.target.checked ? (panel.offsetWidth+panel.offsetLeft) + 'px' : '';
            }.bind(bar,lpanel));
            addEvent(lctrl,'resize',function(panel,event) {
                if (!event.target.checked) return;
                this.style.left = (panel.offsetWidth+panel.offsetLeft) + 'px';
            }.bind(bar,lpanel));
        }
        function configureYieldRight(main,bar,rctrl,ryield) {
            if (rctrl === null) return;
            let rpanel = document.getElementById(rctrl.value);
            if (!ryield) {
                rpanel.style.top = main.style.top;
                return
            }
            bar.style.right = main.style.right;
            addEvent(rctrl,'change',function(panel,event) {
                this.style.right = event.target.checked ? (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px' : '';
            }.bind(bar,rpanel));
            addEvent(rctrl,'resize',function(panel,event) {
                if (!event.target.checked) return;
                this.style.right = event.target.checked ? (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px' : '';
            }.bind(bar,rpanel));
        }
        return function(pagecontrol,main,barid) {
            let bar = document.getElementById(barid);
            if (bar === null) {
                console.warn("Could not set up topbar: element with id '" + barid + "' does not exist in document");
                return;
            }
            bar.classList.add('page-topbar');
            main.style.top = (bar.offsetHeight+bar.offsetTop) + 'px';
            let pyield = bar.hasAttribute('yield') ? bar.getAttribute('yield').split(',') : [];
            configureYieldLeft(main,bar,pagecontrol.elements.namedItem('left'),pyield.includes('left'))
            configureYieldRight(main,bar,pagecontrol.elements.namedItem('right'),pyield.includes('right'))
        }
    }());
    
    
    
    function setupHideToggle(panel,control) {
        let toggleid = panel.getAttribute('hide-toggle');
        if (!toggleid) return;
        var toggle = document.getElementById(toggleid);
        if (toggle===null) {
            console.warn("Could not set up hide toggle button for "+control.name+" panel: element with id '" + toggleid + "' does not exist in document");
            return;
        }
        if (toggle.tagName=='LABEL') {
            if (toggle.control === null) {
                toggle.htmlFor = control.id;
                toggle.classList.toggle('active',control.checked);
                return;
            }
            toggle = toggle.control;
        }
        if (toggle.tagName !== 'INPUT' || toggle.type !== 'checkbox') {
            console.warn("Could not set up hide toggle button for "+control.name+" panel: element must be of type input[type='checkbox']");
            return;
        }
        addEvent(toggle,'change',function(event) {
            var evt = new Event("change", {'bubbles':false, 'cancelable':false,'composed':false});
            this.dispatchEvent(evt);
        }.bind(control));
    }



    var setupSidePanel = (function() {
        // this is main in all togglePanel & resizePanel functions
        
        function configureYieldLeft(bpanel,lpanel,lctrl) {
            switch (lpanel.getAttribute('page-panel')) {
                case 'fixed':
                    addEvent(lctrl,'change',function(panel,event) {
                        this.style.left = event.target.checked ? (panel.offsetWidth+panel.offsetLeft) + 'px' : '0';
                    }.bind(bpanel,lpanel));
                    addEvent(lctrl,'resize',function(panel,event) {
                        if (event.target.checked) this.style.left = (panel.offsetWidth+panel.offsetLeft) + 'px';
                    }.bind(bpanel,lpanel));
                    break;
                case 'flex':
                    addEvent(lctrl,'change',function(panel,event) {
                        this.style.left = event.target.checked ? panel.getAttribute('pct') + '%' : '0';
                    }.bind(bpanel,lpanel));
                    addEvent(lctrl,'resize',function(panel,event) {
                        if (event.target.checked) this.style.left = panel.getAttribute('pct') + '%'
                    }.bind(bpanel,lpanel));
                    break;
            }
        }

        function configureYieldRight(bpanel,rpanel,rctrl) {
            switch (rpanel.getAttribute('page-panel')) {
                case 'fixed':
                    addEvent(rctrl,'change',function(panel,event) {
                        this.style.right = event.target.checked ? (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px' : '0';
                    }.bind(bpanel,rpanel));
                    addEvent(rctrl,'resize',function(panel,event) {
                        if (event.target.checked) this.style.right = (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px';
                    }.bind(bpanel,rpanel));
                    break;
                case 'flex':
                    addEvent(rctrl,'change',function(panel,event) {
                        this.style.right = event.target.checked ? panel.getAttribute('pct') + '%' : '0';
                    }.bind(bpanel,rpanel));
                    addEvent(rctrl,'resize',function(panel,event) {
                        if (event.target.checked) this.style.right = panel.getAttribute('pct') + '%'
                    }.bind(bpanel,rpanel));
                    break;
            }
        }

        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function (fn) { return window.setTimeout(fn, 20); };

        function widthChangeSensor(element,callback) {
            let style = 'pointer-events: none; position: absolute; left: -10px; top: 0px; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden; max-width: 100%;';
            let sensor = element.appendChild(document.createElement('div'));
            sensor.classList.add('resize-sensor');
            sensor.setAttribute('dir','ltr');
            sensor.style.cssText = style;
            sensor.innerHTML = ["<div class='resize-sensor-expand' style='"+style+"'><div style='position: absolute; left: 0; top: 0; transition: 0s; width: 100000px; height: 100%;'></div></div>",
                                "<div class='resize-sensor-shrink' style='"+style+"'><div style='position: absolute; left: 0; top: 0; transition: 0s; width: 200%; height: 100%'></div></div>"].join('');
            
            let expand = sensor.firstElementChild;
            let shrink = sensor.lastElementChild;
            
            var dirty,rafId,newWidth,lastWidth = Math.round(element.getBoundingClientRect().width);

            var resetSensor = function() {
                shrink.scrollLeft = expand.scrollLeft = 100000;
            };
            var onResized = function() {
                rafId = 0;
                if (!dirty) return;
                callback(lastWidth = newWidth);
            };
            var onScroll = function(event) {
                newWidth = Math.round(element.getBoundingClientRect().width);
                dirty = newWidth !== lastWidth
                if (dirty && !rafId) rafId = requestAnimationFrame(onResized);
                resetSensor();
            };
            addEvent(expand,'scroll',onScroll);
            addEvent(shrink,'scroll',onScroll);
            requestAnimationFrame(resetSensor); // Fix for custom Elements?
        }

        function heightChangeSensor(element,callback) {
            let style = 'pointer-events: none; position: absolute; left: 0px; top: -10px; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden; max-width: 100%;';
            let sensor = element.appendChild(document.createElement('div'));
            sensor.classList.add('resize-sensor');
            sensor.setAttribute('dir','ltr');
            sensor.style.cssText = style;
            sensor.innerHTML = ["<div class='resize-sensor-expand' style='"+style+"'><div style='position: absolute; left: 0; top: 0; transition: 0s; width: 100%; height: 100000px;'></div></div>",
                                "<div class='resize-sensor-shrink' style='"+style+"'><div style='position: absolute; left: 0; top: 0; transition: 0s; width: 100%; height: 200%'></div></div>"].join('');
            let expand = sensor.firstElementChild;
            let shrink = sensor.lastElementChild;

            var dirty,rafId,newHeight,lastHeight = Math.round(element.getBoundingClientRect().height);

            var resetSensor = function() {
                shrink.scrollTop = expand.scrollTop = 100000;
            };
            var onResized = function() {
                rafId = 0;
                if (!dirty) return;
                callback(lastHeight = newHeight);
            };
            var onScroll = function(event) {
                newHeight = Math.round(element.getBoundingClientRect().height);
                dirty = newHeight !== lastHeight;
                if (dirty && !rafId) rafId = requestAnimationFrame(onResized);
                resetSensor();
            };
            addEvent(expand,'scroll',onScroll);
            addEvent(shrink,'scroll',onScroll);
            requestAnimationFrame(resetSensor); // Fix for custom Elements?
        }

        var fixedPanel = (function() {
            return {
                left: (function() {
                    function toggle(panel,event) {
                        let checked = event.target.checked;
                        Array.prototype.forEach.call(event.target.labels,e => e.classList.toggle('active',checked))
                        panel.classList.toggle('hidden',!checked);
                        this.style.left = checked ? (panel.offsetWidth+panel.offsetLeft) + 'px' : '0';
                    }
                    function resize(panel,event) {
                        if (!event.target.checked) return;
                        this.style.left = (panel.offsetWidth+panel.offsetLeft) + 'px';
                    }
                    return function(main,panel,control) {
                        addEvent(control,'change',toggle.bind(main,panel));
                        addEvent(control,'resize',resize.bind(main,panel));
                        panel.style.bottom = panel.style.top = panel.style.left = '0';
                        main.style.left = control.checked ? (panel.offsetWidth+panel.offsetLeft) + 'px' : '0';
                        widthChangeSensor(panel,function(width) {
                            console.log(`%c Left Panel Resized: ${width}`,'color:#cc00cc;font-weight:bold;');
                            control.dispatchEvent(new Event("resize"));
                        });
                    }
                }()),
                
                right: (function(){
                    function toggle(panel,event) {
                        let checked = event.target.checked;
                        Array.prototype.forEach.call(event.target.labels,e => e.classList.toggle('active',checked))
                        panel.classList.toggle('hidden',!checked);
                        this.style.right = checked ? (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px' : '0';
                    }
                    function resize(panel,event) {
                        if (!event.target.checked) return;
                        this.style.right = (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px';
                    }
                    return function(main,panel,control) {
                        addEvent(control,'change',toggle.bind(main,panel));
                        addEvent(control,'resize',resize.bind(main,panel));
                        panel.style.bottom = panel.style.top = panel.style.right = '0';
                        main.style.right = control.checked ? (panel.parentElement.offsetWidth - panel.offsetLeft) + 'px' : '0';
                        widthChangeSensor(panel,function(width) {
                            console.log(`%c Right Panel Resized: ${width}`,'color:#cc00cc;font-weight:bold;');
                            control.dispatchEvent(new Event("resize"));
                        });
                    }
                }()),
                bottom: (function(){
                    function toggle(panel,event) {
                        let checked = event.target.checked;
                        Array.prototype.forEach.call(event.target.labels,e => e.classList.toggle('active',checked))
                        panel.classList.toggle('hidden',!checked);
                        this.style.bottom = checked ? (panel.parentElement.offsetHeight - panel.offsetTop) + 'px' : '0';
                    }
                    function resize(panel,event) {
                        if (!event.target.checked) return;
                        this.style.bottom = (panel.parentElement.offsetHeight - panel.offsetTop) + 'px';
                    }
                    function yieldToggle(panel,event) {
                        this.style.bottom = event.target.checked ? (panel.parentElement.offsetHeight - panel.offsetTop) + 'px' : '0';
                    }
                    function yieldResize(panel,event) {
                        if (event.target.checked) this.style.bottom = (panel.parentElement.offsetHeight - panel.offsetTop) + 'px';
                    }
                    return function(main,panel,control,pagecontrol) {
                        addEvent(control,'change',toggle.bind(main,panel));
                        addEvent(control,'resize',resize.bind(main,panel));
                        panel.style.bottom = panel.style.left = panel.style.right = '0';
                        main.style.bottom = control.checked ? (panel.parentElement.offsetHeight - panel.offsetTop) + 'px': '0';
                        heightChangeSensor(panel,function(height) {
                            console.log(`%c Bottom Panel Resized: ${height}`,'color:#cc00cc;font-weight:bold;');
                            control.dispatchEvent(new Event("resize"));
                        });
                        let pyield = panel.hasAttribute('yield') ? panel.getAttribute('yield').split(',') : [];
                        let lctrl = pagecontrol.elements.namedItem('left');
                        if (lctrl !== null) {
                            let lpanel = document.getElementById(lctrl.value);
                            if (!pyield.includes('left')) {
                                lpanel.style.bottom = main.style.bottom;
                                addEvent(control,'change',yieldToggle.bind(lpanel,panel));
                                addEvent(control,'resize',yieldResize.bind(lpanel,panel));
                            } else {
                                panel.style.left = main.style.left;
                                configureYieldLeft(panel,lpanel,lctrl);
                            }
                        }
                        let rctrl = pagecontrol.elements.namedItem('right');
                        if (rctrl!==null) {
                            let rpanel = document.getElementById(rctrl.value);
                            if (!pyield.includes('right')) {
                                rpanel.style.bottom = main.style.bottom;
                                addEvent(control,'change',yieldToggle.bind(rpanel,panel));
                                addEvent(control,'resize',yieldResize.bind(rpanel,panel));
                            } else {
                                panel.style.right = main.style.right;
                                configureYieldRight(panel,rpanel,rctrl);
                            }
                        }
                    }
                }()),
            }
        }());
        
        var flexPanel = (function(){

            function pctAttr(panel,side) {
                var pct = 20;
                if (panel.hasAttribute('pct')) {
                    pct = parseInt(panel.getAttribute('pct'));
                    if (pct < 0 || pct > 100) {
                        console.warn("Invalid value '"+pct+"' provided for "+side + " flex panel 'pct', must be number between 0 - 100, using default 20");
                        pct = 20;
                    }
                };
                panel.setAttribute('pct',pct);
                return pct;
            }
            return {
                left: (function(){
                    function toggle(panel,event) {
                        let checked = event.target.checked;
                        Array.prototype.forEach.call(event.target.labels,e => e.classList.toggle('active',checked))
                        panel.classList.toggle('hidden',!checked);
                        this.style.left = checked ? panel.getAttribute('pct') + '%' : '0';
                    }
                    function resize(panel,event) {
                        if (!event.target.checked) return;
                        this.style.left = panel.getAttribute('pct') + '%';
                    }
                    return function(main,panel,control) {
                        addEvent(control,'change',toggle.bind(main,panel));
                        addEvent(control,'resize',resize.bind(main,panel));
                        var pct = pctAttr(panel,'left');
                        panel.style.bottom = panel.style.top = panel.style.left = '0';
                        panel.style.right = (100-pct) + '%';
                        main.style.left = control.checked ? (pct + '%') : '0';
                    }
                }()),
                right: (function(){
                    function toggle(panel,event) {
                        let checked = event.target.checked;
                        Array.prototype.forEach.call(event.target.labels,e => e.classList.toggle('active',checked))
                        panel.classList.toggle('hidden',!checked);
                        this.style.right = checked ? panel.getAttribute('pct') + '%' : '0';
                    }
                    function resize(panel,event) {
                        if (!event.target.checked) return;
                        this.style.right = panel.getAttribute('pct') + '%';
                    }
                    return function(main,panel,control) {
                        addEvent(control,'change',toggle.bind(main,panel));
                        addEvent(control,'resize',resize.bind(main,panel));
                        var pct = pctAttr(panel,'right');

                        panel.style.bottom = panel.style.top = panel.style.right = '0';
                        panel.style.left = (100-pct) + '%';
                        main.style.right = control.checked ? (pct + '%') : '0';
                    }
                }()),
                bottom: (function() {
                    function toggle(panel,event) {
                        let checked = event.target.checked;
                        Array.prototype.forEach.call(event.target.labels,e => e.classList.toggle('active',checked))
                        panel.classList.toggle('hidden',!checked);
                        this.style.bottom = checked ? panel.getAttribute('pct') + '%' : '';
                    }
                    function resize(panel,event) {
                        if (!event.target.checked) return;
                        this.style.bottom = panel.getAttribute('pct') + '%';
                    }
                    function yieldToggle(panel,event) {
                        this.style.bottom = event.target.checked ? panel.getAttribute('pct') + '%' : '';
                    }
                    function yieldResize(panel,event) {
                        if (event.target.checked) this.style.bottom = panel.getAttribute('pct') + '%';
                    }
                    return function(main,panel,control,pagecontrol) {
                        addEvent(control,'change',toggle.bind(main,panel));
                        addEvent(control,'resize',resize.bind(main,panel));
                        var pct = pctAttr(panel,'bottom');
                        panel.style.bottom = panel.style.left = panel.style.right = '0';
                        panel.style.top = (100-pct) + '%';
                        main.style.bottom = control.checked ? (pct + '%') : '';
                        let pyield = panel.hasAttribute('yield') ? panel.getAttribute('yield').split(',') : [];
                        let lctrl = pagecontrol.elements.namedItem('left');
                        if (lctrl !== null) {
                            let lpanel = document.getElementById(lctrl.value);
                            if (!pyield.includes('left')) {
                                lpanel.style.bottom = main.style.bottom;
                                addEvent(control,'change',yieldToggle.bind(lpanel,panel));
                                addEvent(control,'resize',yieldResize.bind(lpanel,panel));
                            } else {
                                panel.style.left = main.style.left;
                                configureYieldLeft(panel,lpanel,lctrl);
                            }
                        }
                        let rctrl = pagecontrol.elements.namedItem('right');
                        if (rctrl!==null) {
                            let rpanel = document.getElementById(rctrl.value);
                            if (!pyield.includes('right')) {
                                rpanel.style.bottom = main.style.bottom;
                                addEvent(control,'change',yieldToggle.bind(rpanel,panel));
                                addEvent(control,'resize',yieldResize.bind(rpanel,panel));
                            } else {
                                panel.style.right = main.style.right;
                                configureYieldRight(panel,rpanel,rctrl);
                            }
                        }
                    }
                }()),
            }
        }());
        
        return function(pagecontrol,main,panelid,side) {
            let panel = document.getElementById(panelid);
            if (panel === null) {
                console.warn("Could not set up "+side+" panel: element with id '" + panelid + "' does not exist in document");
                return false;
            }
            // setup panel
            panel.classList.add('page-panel-'+side);
            panel.style.position = 'fixed';
            panel.style.backfaceVisibility = 'hidden';
            // create control
            let control = document.createElement("input");
            control.type = 'checkbox';
            control.value = panelid;
            control.name = side;
            control.id = "pagectrl_"+side;
            control.checked = !panel.classList.contains('hidden');
            pagecontrol.appendChild(control);
            // 'page-panel' attribute
            if (!panel.hasAttribute('page-panel')) panel.setAttribute('page-panel','fixed')
            var ptype = panel.getAttribute('page-panel');
            switch (ptype) {
                case 'flex':
                    flexPanel[side](main,panel,control,pagecontrol);
                    break;
                default:
                    if (ptype !== 'fixed') {
                        console.warn("Invalid page-panel attribute '"+ptype+"', using default value 'fixed'");
                        panel.setAttribute('page-panel','fixed');
                    }
                    fixedPanel[side](main,panel,control,pagecontrol);
                    break;
            }
            if (panel.hasAttribute('hide-toggle')) setupHideToggle(panel,control);
            return true;
        }
    }());

    
    document.addEventListener('readystatechange', (function() {
        var setup_complete = false;
        return function(event) {
            //console.log("readyState:",event.target.readyState,"setup complete:",setup_complete);
            if (setup_complete) return;
            if (!document.body.hasAttribute('page-main')) return;
            let mainid = document.body.getAttribute('page-main'),main = document.getElementById(mainid);
            if (main === null) {
                if (event.target.readyState == 'complete') {
                    console.warn("Could not set up page: element with id '" + mainid + "' does not exist in document");
                    document.body.removeAttribute('page-main');
                }
                return;
            }
            main.classList.add('page-main');
            main.style.position = 'fixed';
            main.style.backfaceVisibility = 'hidden';
            main.style.top = main.style.bottom = main.style.left = main.style.right = '0';
            let pagecontrol = document.body.insertBefore(document.createElement('form'),document.body.firstChild);
            pagecontrol.id = 'pagecontrol';
            pagecontrol.style.display = "none";
            
            if (document.body.hasAttribute('page-panel-left')) {
                if (!setupSidePanel(pagecontrol,main,document.body.getAttribute('page-panel-left'),'left')) {
                    document.body.removeAttribute('page-panel-left');
                }
            }
            if (document.body.hasAttribute('page-panel-right')) {
                if (!setupSidePanel(pagecontrol,main,document.body.getAttribute('page-panel-right'),'right')) {
                    document.body.removeAttribute('page-panel-right');
                }
            }
            if (document.body.hasAttribute('page-panel-bottom')) {
                if (!setupSidePanel(pagecontrol,main,document.body.getAttribute('page-panel-bottom'),'bottom')) {
                    document.body.removeAttribute('page-panel-bottom');
                }
            }
            if (document.body.hasAttribute('page-topbar')) {
                setupTopBar(pagecontrol,main,document.body.getAttribute('page-topbar'));
            }
            if (main.hasAttribute('page-tabbed')) {
                setupTabbed(main);
            }
            setup_complete = true;
            document.body.setAttribute('setup-complete','');
        }
    }()));

}());