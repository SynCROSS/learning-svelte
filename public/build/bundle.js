
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
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

    /* src\AudioPlayer.svelte generated by Svelte v3.31.2 */
    const file = "src\\AudioPlayer.svelte";

    function create_fragment(ctx) {
    	let article;
    	let h2;
    	let t0;
    	let t1;
    	let p;
    	let strong;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let audio_1;
    	let track;
    	let audio_1_src_value;
    	let audio_1_is_paused = true;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			article = element("article");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			p = element("p");
    			strong = element("strong");
    			t2 = text(/*composer*/ ctx[2]);
    			t3 = text(" / performed by ");
    			t4 = text(/*performer*/ ctx[3]);
    			t5 = space();
    			audio_1 = element("audio");
    			track = element("track");
    			attr_dev(h2, "class", "svelte-34xdsu");
    			add_location(h2, file, 35, 2, 710);
    			add_location(strong, file, 36, 5, 733);
    			attr_dev(p, "class", "svelte-34xdsu");
    			add_location(p, file, 36, 2, 730);
    			attr_dev(track, "kind", "captions");
    			add_location(track, file, 39, 4, 876);
    			audio_1.controls = true;
    			if (audio_1.src !== (audio_1_src_value = /*src*/ ctx[0])) attr_dev(audio_1, "src", audio_1_src_value);
    			attr_dev(audio_1, "class", "svelte-34xdsu");
    			add_location(audio_1, file, 38, 2, 797);
    			attr_dev(article, "class", "svelte-34xdsu");
    			toggle_class(article, "playing", !/*paused*/ ctx[5]);
    			add_location(article, file, 34, 0, 673);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h2);
    			append_dev(h2, t0);
    			append_dev(article, t1);
    			append_dev(article, p);
    			append_dev(p, strong);
    			append_dev(strong, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(article, t5);
    			append_dev(article, audio_1);
    			append_dev(audio_1, track);
    			/*audio_1_binding*/ ctx[7](audio_1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(audio_1, "play", /*audio_1_play_pause_handler*/ ctx[8]),
    					listen_dev(audio_1, "pause", /*audio_1_play_pause_handler*/ ctx[8]),
    					listen_dev(audio_1, "play", /*stopOthers*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);
    			if (dirty & /*composer*/ 4) set_data_dev(t2, /*composer*/ ctx[2]);
    			if (dirty & /*performer*/ 8) set_data_dev(t4, /*performer*/ ctx[3]);

    			if (dirty & /*src*/ 1 && audio_1.src !== (audio_1_src_value = /*src*/ ctx[0])) {
    				attr_dev(audio_1, "src", audio_1_src_value);
    			}

    			if (dirty & /*paused*/ 32 && audio_1_is_paused !== (audio_1_is_paused = /*paused*/ ctx[5])) {
    				audio_1[audio_1_is_paused ? "pause" : "play"]();
    			}

    			if (dirty & /*paused*/ 32) {
    				toggle_class(article, "playing", !/*paused*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			/*audio_1_binding*/ ctx[7](null);
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

    const elements = new Set();

    function stopAll() {
    	elements.forEach(element => {
    		element.pause();
    	});
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AudioPlayer", slots, []);
    	let { src } = $$props;
    	let { title } = $$props;
    	let { composer } = $$props;
    	let { performer } = $$props;
    	let audio;
    	let paused = true;

    	onMount(() => {
    		elements.add(audio);
    		return () => elements.delete(audio);
    	});

    	function stopOthers() {
    		elements.forEach(element => {
    			if (element !== audio) element.pause();
    		});
    	}

    	const writable_props = ["src", "title", "composer", "performer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AudioPlayer> was created with unknown prop '${key}'`);
    	});

    	function audio_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			audio = $$value;
    			$$invalidate(4, audio);
    		});
    	}

    	function audio_1_play_pause_handler() {
    		paused = this.paused;
    		$$invalidate(5, paused);
    	}

    	$$self.$$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("composer" in $$props) $$invalidate(2, composer = $$props.composer);
    		if ("performer" in $$props) $$invalidate(3, performer = $$props.performer);
    	};

    	$$self.$capture_state = () => ({
    		elements,
    		stopAll,
    		onMount,
    		src,
    		title,
    		composer,
    		performer,
    		audio,
    		paused,
    		stopOthers
    	});

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("composer" in $$props) $$invalidate(2, composer = $$props.composer);
    		if ("performer" in $$props) $$invalidate(3, performer = $$props.performer);
    		if ("audio" in $$props) $$invalidate(4, audio = $$props.audio);
    		if ("paused" in $$props) $$invalidate(5, paused = $$props.paused);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		src,
    		title,
    		composer,
    		performer,
    		audio,
    		paused,
    		stopOthers,
    		audio_1_binding,
    		audio_1_play_pause_handler
    	];
    }

    class AudioPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			src: 0,
    			title: 1,
    			composer: 2,
    			performer: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AudioPlayer",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'src'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'title'");
    		}

    		if (/*composer*/ ctx[2] === undefined && !("composer" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'composer'");
    		}

    		if (/*performer*/ ctx[3] === undefined && !("performer" in props)) {
    			console.warn("<AudioPlayer> was created without expected prop 'performer'");
    		}
    	}

    	get src() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get composer() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set composer(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get performer() {
    		throw new Error("<AudioPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set performer(value) {
    		throw new Error("<AudioPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.2 */
    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t1;
    	let audioplayer0;
    	let t2;
    	let audioplayer1;
    	let t3;
    	let audioplayer2;
    	let t4;
    	let audioplayer3;
    	let t5;
    	let audioplayer4;
    	let current;
    	let mounted;
    	let dispose;

    	audioplayer0 = new AudioPlayer({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/strauss.mp3",
    				title: "The Blue Danube Waltz",
    				composer: "Johann Strauss",
    				performer: "European Archive"
    			},
    			$$inline: true
    		});

    	audioplayer1 = new AudioPlayer({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/holst.mp3",
    				title: "Mars, the Bringer of War",
    				composer: "Gustav Holst",
    				performer: "USAF Heritage of America Band"
    			},
    			$$inline: true
    		});

    	audioplayer2 = new AudioPlayer({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/satie.mp3",
    				title: "Gymnopédie no. 1",
    				composer: "Erik Satie",
    				performer: "Prodigal Procrastinator"
    			},
    			$$inline: true
    		});

    	audioplayer3 = new AudioPlayer({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/beethoven.mp3",
    				title: "Symphony no. 5 in Cm, Op. 67 - I. Allegro con brio",
    				composer: "Ludwig van Beethoven",
    				performer: "European Archive"
    			},
    			$$inline: true
    		});

    	audioplayer4 = new AudioPlayer({
    			props: {
    				src: "https://sveltejs.github.io/assets/music/mozart.mp3",
    				title: "Requiem in D minor, K. 626 - III. Sequence - Lacrymosa",
    				composer: "Wolfgang Amadeus Mozart",
    				performer: "Markus Staab"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "stop all audio";
    			t1 = space();
    			create_component(audioplayer0.$$.fragment);
    			t2 = space();
    			create_component(audioplayer1.$$.fragment);
    			t3 = space();
    			create_component(audioplayer2.$$.fragment);
    			t4 = space();
    			create_component(audioplayer3.$$.fragment);
    			t5 = space();
    			create_component(audioplayer4.$$.fragment);
    			add_location(button, file$1, 4, 0, 83);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(audioplayer0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(audioplayer1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(audioplayer2, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(audioplayer3, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(audioplayer4, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", stopAll, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(audioplayer0.$$.fragment, local);
    			transition_in(audioplayer1.$$.fragment, local);
    			transition_in(audioplayer2.$$.fragment, local);
    			transition_in(audioplayer3.$$.fragment, local);
    			transition_in(audioplayer4.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(audioplayer0.$$.fragment, local);
    			transition_out(audioplayer1.$$.fragment, local);
    			transition_out(audioplayer2.$$.fragment, local);
    			transition_out(audioplayer3.$$.fragment, local);
    			transition_out(audioplayer4.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			destroy_component(audioplayer0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(audioplayer1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(audioplayer2, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(audioplayer3, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(audioplayer4, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ AudioPlayer, stopAll });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
