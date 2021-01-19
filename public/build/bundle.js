
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function compute_slots(slots) {
        const result = {};
        for (const key in slots) {
            result[key] = true;
        }
        return result;
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    /* src\Project.svelte generated by Svelte v3.31.2 */

    const file = "src\\Project.svelte";
    const get_comments_slot_changes = dirty => ({});
    const get_comments_slot_context = ctx => ({});

    // (12:2) {#if $$slots.comments}
    function create_if_block(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let current;
    	const comments_slot_template = /*#slots*/ ctx[5].comments;
    	const comments_slot = create_slot(comments_slot_template, ctx, /*$$scope*/ ctx[4], get_comments_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Comments";
    			t1 = space();
    			if (comments_slot) comments_slot.c();
    			attr_dev(h3, "class", "svelte-gma00v");
    			add_location(h3, file, 13, 6, 320);
    			attr_dev(div, "class", "discussion svelte-gma00v");
    			add_location(div, file, 12, 4, 288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);

    			if (comments_slot) {
    				comments_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (comments_slot) {
    				if (comments_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(comments_slot, comments_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_comments_slot_changes, get_comments_slot_context);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comments_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comments_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (comments_slot) comments_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:2) {#if $$slots.comments}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let article;
    	let div;
    	let h2;
    	let t0;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let current;
    	let if_block = /*$$slots*/ ctx[3].comments && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			p = element("p");
    			t2 = text(/*tasksCompleted*/ ctx[1]);
    			t3 = text("/");
    			t4 = text(/*totalTasks*/ ctx[2]);
    			t5 = text(" tasks completed");
    			t6 = space();
    			if (if_block) if_block.c();
    			attr_dev(h2, "class", "svelte-gma00v");
    			add_location(h2, file, 8, 4, 172);
    			attr_dev(p, "class", "svelte-gma00v");
    			add_location(p, file, 9, 4, 194);
    			attr_dev(div, "class", "svelte-gma00v");
    			add_location(div, file, 7, 2, 161);
    			attr_dev(article, "class", "svelte-gma00v");
    			toggle_class(article, "has-discussion", /*$$slots*/ ctx[3].comments);
    			add_location(article, file, 6, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(article, t6);
    			if (if_block) if_block.m(article, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (!current || dirty & /*tasksCompleted*/ 2) set_data_dev(t2, /*tasksCompleted*/ ctx[1]);
    			if (!current || dirty & /*totalTasks*/ 4) set_data_dev(t4, /*totalTasks*/ ctx[2]);

    			if (/*$$slots*/ ctx[3].comments) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$$slots*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(article, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*$$slots*/ 8) {
    				toggle_class(article, "has-discussion", /*$$slots*/ ctx[3].comments);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Project", slots, ['comments']);
    	const $$slots = compute_slots(slots);
    	let { title } = $$props;
    	let { tasksCompleted = 0 } = $$props;
    	let { totalTasks = 0 } = $$props;
    	const writable_props = ["title", "tasksCompleted", "totalTasks"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Project> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tasksCompleted" in $$props) $$invalidate(1, tasksCompleted = $$props.tasksCompleted);
    		if ("totalTasks" in $$props) $$invalidate(2, totalTasks = $$props.totalTasks);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ title, tasksCompleted, totalTasks });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tasksCompleted" in $$props) $$invalidate(1, tasksCompleted = $$props.tasksCompleted);
    		if ("totalTasks" in $$props) $$invalidate(2, totalTasks = $$props.totalTasks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, tasksCompleted, totalTasks, $$slots, $$scope, slots];
    }

    class Project extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			title: 0,
    			tasksCompleted: 1,
    			totalTasks: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Project",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<Project> was created without expected prop 'title'");
    		}
    	}

    	get title() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tasksCompleted() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tasksCompleted(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get totalTasks() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set totalTasks(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Comment.svelte generated by Svelte v3.31.2 */

    const file$1 = "src\\Comment.svelte";

    function create_fragment$1(ctx) {
    	let article;
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h4;
    	let t1;
    	let t2;
    	let time;
    	let t3_value = /*postedAt*/ ctx[1].toLocaleDateString() + "";
    	let t3;
    	let time_datetime_value;
    	let t4;
    	let div2;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h4 = element("h4");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = space();
    			time = element("time");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			if (img.src !== (img_src_value = /*avatar*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "height", "32");
    			attr_dev(img, "width", "32");
    			add_location(img, file$1, 12, 4, 253);
    			attr_dev(h4, "class", "svelte-16rszjd");
    			add_location(h4, file$1, 14, 6, 338);
    			attr_dev(time, "datetime", time_datetime_value = /*postedAt*/ ctx[1].toISOString());
    			attr_dev(time, "class", "svelte-16rszjd");
    			add_location(time, file$1, 15, 6, 361);
    			attr_dev(div0, "class", "details svelte-16rszjd");
    			add_location(div0, file$1, 13, 4, 309);
    			attr_dev(div1, "class", "header svelte-16rszjd");
    			add_location(div1, file$1, 11, 2, 227);
    			attr_dev(div2, "class", "body svelte-16rszjd");
    			add_location(div2, file$1, 20, 2, 483);
    			attr_dev(article, "class", "svelte-16rszjd");
    			add_location(article, file$1, 10, 0, 214);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div1);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h4);
    			append_dev(h4, t1);
    			append_dev(div0, t2);
    			append_dev(div0, time);
    			append_dev(time, t3);
    			append_dev(article, t4);
    			append_dev(article, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*avatar*/ 4 && img.src !== (img_src_value = /*avatar*/ ctx[2])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    			if ((!current || dirty & /*postedAt*/ 2) && t3_value !== (t3_value = /*postedAt*/ ctx[1].toLocaleDateString() + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*postedAt*/ 2 && time_datetime_value !== (time_datetime_value = /*postedAt*/ ctx[1].toISOString())) {
    				attr_dev(time, "datetime", time_datetime_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (default_slot) default_slot.d(detaching);
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
    	let avatar;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Comment", slots, ['default']);
    	let { name } = $$props;
    	let { postedAt } = $$props;
    	const writable_props = ["name", "postedAt"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Comment> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("postedAt" in $$props) $$invalidate(1, postedAt = $$props.postedAt);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ name, postedAt, avatar });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("postedAt" in $$props) $$invalidate(1, postedAt = $$props.postedAt);
    		if ("avatar" in $$props) $$invalidate(2, avatar = $$props.avatar);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*name*/ 1) {
    			 $$invalidate(2, avatar = `https://ui-avatars.com/api/?name=${name.replace(/ /g, "+")}&rounded=true&background=ff3e00&color=fff&bold=true`);
    		}
    	};

    	return [name, postedAt, avatar, $$scope, slots];
    }

    class Comment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 0, postedAt: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Comment",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Comment> was created without expected prop 'name'");
    		}

    		if (/*postedAt*/ ctx[1] === undefined && !("postedAt" in props)) {
    			console.warn("<Comment> was created without expected prop 'postedAt'");
    		}
    	}

    	get name() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get postedAt() {
    		throw new Error("<Comment>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set postedAt(value) {
    		throw new Error("<Comment>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.2 */
    const file$2 = "src\\App.svelte";

    // (12:8) <Comment name="Ecma Script" postedAt={new Date('2020-08-17T14:12:23')}>
    function create_default_slot_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Those interface tests are now passing.";
    			add_location(p, file$2, 12, 10, 334);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(12:8) <Comment name=\\\"Ecma Script\\\" postedAt={new Date('2020-08-17T14:12:23')}>",
    		ctx
    	});

    	return block;
    }

    // (11:6) <div slot="comments">
    function create_comments_slot(ctx) {
    	let div;
    	let comment;
    	let current;

    	comment = new Comment({
    			props: {
    				name: "Ecma Script",
    				postedAt: new Date("2020-08-17T14:12:23"),
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(comment.$$.fragment);
    			attr_dev(div, "slot", "comments");
    			add_location(div, file$2, 10, 6, 222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(comment, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const comment_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				comment_changes.$$scope = { dirty, ctx };
    			}

    			comment.$set(comment_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(comment.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(comment.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(comment);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_comments_slot.name,
    		type: "slot",
    		source: "(11:6) <div slot=\\\"comments\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let h1;
    	let t1;
    	let ul;
    	let li0;
    	let project0;
    	let t2;
    	let li1;
    	let project1;
    	let current;

    	project0 = new Project({
    			props: {
    				title: "Add Typescript support",
    				tasksCompleted: 25,
    				totalTasks: 57,
    				$$slots: { comments: [create_comments_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	project1 = new Project({
    			props: {
    				title: "Update documentation",
    				tasksCompleted: 18,
    				totalTasks: 21
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Projects";
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			create_component(project0.$$.fragment);
    			t2 = space();
    			li1 = element("li");
    			create_component(project1.$$.fragment);
    			attr_dev(h1, "class", "svelte-pcfhwx");
    			add_location(h1, file$2, 5, 0, 104);
    			attr_dev(li0, "class", "svelte-pcfhwx");
    			add_location(li0, file$2, 8, 2, 130);
    			attr_dev(li1, "class", "svelte-pcfhwx");
    			add_location(li1, file$2, 17, 2, 437);
    			attr_dev(ul, "class", "svelte-pcfhwx");
    			add_location(ul, file$2, 7, 0, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			mount_component(project0, li0, null);
    			append_dev(ul, t2);
    			append_dev(ul, li1);
    			mount_component(project1, li1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const project0_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				project0_changes.$$scope = { dirty, ctx };
    			}

    			project0.$set(project0_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(project0.$$.fragment, local);
    			transition_in(project1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(project0.$$.fragment, local);
    			transition_out(project1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_component(project0);
    			destroy_component(project1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Project, Comment });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
