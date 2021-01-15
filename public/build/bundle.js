
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.31.2 */

    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let h1;
    	let t1;
    	let p;
    	let t2;
    	let a;
    	let t4;
    	let t5;
    	let ul0;
    	let li0;
    	let t7;
    	let li1;
    	let t9;
    	let li2;
    	let t11;
    	let li3;
    	let t13;
    	let li4;
    	let t15;
    	let li5;
    	let t17;
    	let ul1;
    	let li6;
    	let t19;
    	let li7;
    	let t21;
    	let li8;
    	let t23;
    	let li9;
    	let t25;
    	let li10;
    	let t27;
    	let div2;
    	let video;
    	let t28;
    	let t29;
    	let t30;
    	let track;
    	let video_src_value;
    	let t31;
    	let div1;
    	let progress;
    	let progress_value_value;
    	let t32;
    	let div0;
    	let span0;
    	let t33_value = format(/*time*/ ctx[0]) + "";
    	let t33;
    	let t34;
    	let span1;
    	let t38;
    	let span2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Caminandes: Llamigos";
    			t1 = space();
    			p = element("p");
    			t2 = text("From ");
    			a = element("a");
    			a.textContent = "Blender Open Projects";
    			t4 = text(". CC-BY");
    			t5 = text("\nThe complete set of bindings for {audio} and {video}\nis as follows — six readonly bindings...\n");
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "duration (readonly) — the total duration of the video, in seconds";
    			t7 = space();
    			li1 = element("li");
    			li1.textContent = "buffered (readonly) — an array of {start, end} objects";
    			t9 = space();
    			li2 = element("li");
    			li2.textContent = "seekable (readonly) — ditto";
    			t11 = space();
    			li3 = element("li");
    			li3.textContent = "played (readonly) — ditto";
    			t13 = space();
    			li4 = element("li");
    			li4.textContent = "seeking (readonly) — boolean";
    			t15 = space();
    			li5 = element("li");
    			li5.textContent = "ended (readonly) — boolean";
    			t17 = text("\n...and five two-way bindings:\n");
    			ul1 = element("ul");
    			li6 = element("li");
    			li6.textContent = "currentTime — the current point in the video, in seconds";
    			t19 = space();
    			li7 = element("li");
    			li7.textContent = "playbackRate — how fast to play the video, where 1 is 'normal'";
    			t21 = space();
    			li8 = element("li");
    			li8.textContent = "paused — this one should be self-explanatory";
    			t23 = space();
    			li9 = element("li");
    			li9.textContent = "volume — a value between 0 and 1";
    			t25 = space();
    			li10 = element("li");
    			li10.textContent = "muted — a boolean value where true is muted";
    			t27 = text("\nVideos additionally have readonly videoWidth and videoHeight bindings.\n");
    			div2 = element("div");
    			video = element("video");
    			t28 = text("bind:currentTime=");
    			t29 = text(/*time*/ ctx[0]);
    			t30 = text("\n    bind:duration bind:paused\n    ");
    			track = element("track");
    			t31 = space();
    			div1 = element("div");
    			progress = element("progress");
    			t32 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t33 = text(t33_value);
    			t34 = space();
    			span1 = element("span");
    			span1.textContent = `click anywhere to ${/*paused*/ ctx[3] ? "play" : "pause"} / drag to seek`;
    			t38 = space();
    			span2 = element("span");
    			span2.textContent = `${format(/*duration*/ ctx[2])}`;
    			add_location(h1, file, 53, 0, 1375);
    			attr_dev(a, "href", "https://cloud.blender.org/open-projects");
    			add_location(a, file, 55, 7, 1416);
    			add_location(p, file, 54, 0, 1405);
    			add_location(li0, file, 62, 2, 1641);
    			add_location(li1, file, 63, 2, 1718);
    			add_location(li2, file, 64, 2, 1798);
    			add_location(li3, file, 65, 2, 1837);
    			add_location(li4, file, 66, 2, 1874);
    			add_location(li5, file, 67, 2, 1914);
    			add_location(ul0, file, 61, 0, 1634);
    			add_location(li6, file, 71, 2, 1993);
    			add_location(li7, file, 72, 2, 2061);
    			add_location(li8, file, 73, 2, 2135);
    			add_location(li9, file, 74, 2, 2191);
    			add_location(li10, file, 75, 2, 2235);
    			add_location(ul1, file, 70, 0, 1986);
    			attr_dev(track, "kind", "captions");
    			add_location(track, file, 86, 4, 2652);
    			attr_dev(video, "poster", "https://sveltejs.github.io/assets/caminandes-llamigos.jpg");
    			if (video.src !== (video_src_value = "https://sveltejs.github.io/assets/caminandes-llamigos.mp4")) attr_dev(video, "src", video_src_value);
    			attr_dev(video, "class", "svelte-11bzk4c");
    			add_location(video, file, 79, 2, 2373);
    			progress.value = progress_value_value = /*time*/ ctx[0] / /*duration*/ ctx[2] || 0;
    			attr_dev(progress, "class", "svelte-11bzk4c");
    			add_location(progress, file, 90, 4, 2771);
    			attr_dev(span0, "class", "time svelte-11bzk4c");
    			add_location(span0, file, 93, 6, 2843);
    			attr_dev(span1, "class", "svelte-11bzk4c");
    			add_location(span1, file, 94, 6, 2890);
    			attr_dev(span2, "class", "time svelte-11bzk4c");
    			add_location(span2, file, 95, 6, 2970);
    			attr_dev(div0, "class", "info svelte-11bzk4c");
    			add_location(div0, file, 92, 4, 2818);
    			attr_dev(div1, "class", "controls svelte-11bzk4c");
    			set_style(div1, "opacity", /*duration*/ ctx[2] && /*showControls*/ ctx[1] ? 1 : 0);
    			add_location(div1, file, 89, 2, 2692);
    			attr_dev(div2, "class", "svelte-11bzk4c");
    			add_location(div2, file, 78, 0, 2365);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t2);
    			append_dev(p, a);
    			append_dev(p, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, ul0, anchor);
    			append_dev(ul0, li0);
    			append_dev(ul0, t7);
    			append_dev(ul0, li1);
    			append_dev(ul0, t9);
    			append_dev(ul0, li2);
    			append_dev(ul0, t11);
    			append_dev(ul0, li3);
    			append_dev(ul0, t13);
    			append_dev(ul0, li4);
    			append_dev(ul0, t15);
    			append_dev(ul0, li5);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, ul1, anchor);
    			append_dev(ul1, li6);
    			append_dev(ul1, t19);
    			append_dev(ul1, li7);
    			append_dev(ul1, t21);
    			append_dev(ul1, li8);
    			append_dev(ul1, t23);
    			append_dev(ul1, li9);
    			append_dev(ul1, t25);
    			append_dev(ul1, li10);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, video);
    			append_dev(video, t28);
    			append_dev(video, t29);
    			append_dev(video, t30);
    			append_dev(video, track);
    			append_dev(div2, t31);
    			append_dev(div2, div1);
    			append_dev(div1, progress);
    			append_dev(div1, t32);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t33);
    			append_dev(div0, t34);
    			append_dev(div0, span1);
    			append_dev(div0, t38);
    			append_dev(div0, span2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(video, "mousemove", /*handleMousemove*/ ctx[4], false, false, false),
    					listen_dev(video, "mousedown", /*handleMousedown*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*time*/ 1) set_data_dev(t29, /*time*/ ctx[0]);

    			if (dirty & /*time*/ 1 && progress_value_value !== (progress_value_value = /*time*/ ctx[0] / /*duration*/ ctx[2] || 0)) {
    				prop_dev(progress, "value", progress_value_value);
    			}

    			if (dirty & /*time*/ 1 && t33_value !== (t33_value = format(/*time*/ ctx[0]) + "")) set_data_dev(t33, t33_value);

    			if (dirty & /*showControls*/ 2) {
    				set_style(div1, "opacity", /*duration*/ ctx[2] && /*showControls*/ ctx[1] ? 1 : 0);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(ul0);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(ul1);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function format(seconds) {
    	if (isNaN(seconds)) return "...";
    	const minutes = Math.floor(seconds / 60);
    	seconds = Math.floor(seconds % 60);
    	if (seconds < 10) seconds = "0" + seconds;
    	return `${minutes}:${seconds}`;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let time = 0;
    	let duration;
    	let paused = true;
    	let showControls = true;
    	let showControlsTimeout;

    	function handleMousemove(e) {
    		// Make the controls visible, but fade out after
    		// 2.5 seconds of inactivity
    		clearTimeout(showControlsTimeout);

    		showControlsTimeout = setTimeout(() => $$invalidate(1, showControls = false), 2500);
    		$$invalidate(1, showControls = true);
    		if (!(e.buttons & 1)) return; // mouse not down
    		if (!duration) return; // video not loaded yet
    		const { left, right } = this.getBoundingClientRect();
    		$$invalidate(0, time = duration * (e.clientX - left) / (right - left));
    	}

    	function handleMousedown(e) {
    		// we can't rely on the built-in click event, because it fires
    		// after a drag — we have to listen for clicks ourselves
    		function handleMouseup() {
    			if (paused) e.target.play(); else e.target.pause();
    			cancel();
    		}

    		function cancel() {
    			e.target.removeEventListener("mouseup", handleMouseup);
    		}

    		e.target.addEventListener("mouseup", handleMouseup);
    		setTimeout(cancel, 200);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		time,
    		duration,
    		paused,
    		showControls,
    		showControlsTimeout,
    		handleMousemove,
    		handleMousedown,
    		format
    	});

    	$$self.$inject_state = $$props => {
    		if ("time" in $$props) $$invalidate(0, time = $$props.time);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("paused" in $$props) $$invalidate(3, paused = $$props.paused);
    		if ("showControls" in $$props) $$invalidate(1, showControls = $$props.showControls);
    		if ("showControlsTimeout" in $$props) showControlsTimeout = $$props.showControlsTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [time, showControls, duration, paused, handleMousemove, handleMousedown];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
