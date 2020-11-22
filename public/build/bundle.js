
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.7' }, detail)));
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
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

    /* src/Link.svelte generated by Svelte v3.29.7 */

    const file = "src/Link.svelte";

    function create_fragment(ctx) {
    	let a;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "href", /*href*/ ctx[0]);
    			attr_dev(a, "rel", "noopener");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 4, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*href*/ 1) {
    				attr_dev(a, "href", /*href*/ ctx[0]);
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
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("Link", slots, ['default']);
    	let { href } = $$props;
    	const writable_props = ["href"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ href });

    	$$self.$inject_state = $$props => {
    		if ("href" in $$props) $$invalidate(0, href = $$props.href);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [href, $$scope, slots];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { href: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*href*/ ctx[0] === undefined && !("href" in props)) {
    			console.warn("<Link> was created without expected prop 'href'");
    		}
    	}

    	get href() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/InfoPopup.svelte generated by Svelte v3.29.7 */
    const file$1 = "src/InfoPopup.svelte";

    // (14:4) <Link href="https://github.com/macbre/phantomas">
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Phantomas");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(14:4) <Link href=\\\"https://github.com/macbre/phantomas\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let article;
    	let header;
    	let h1;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t4;
    	let link;
    	let t5;
    	let t6;
    	let p2;
    	let t8;
    	let p3;
    	let strong;
    	let t10;
    	let current;

    	link = new Link({
    			props: {
    				href: "https://github.com/macbre/phantomas",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			article = element("article");
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Technical Details";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "The values shown in the list are URL, Total Weight, Content Ratio.";
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Websites listed here are downloaded and analyzed with\n    ");
    			create_component(link.$$.fragment);
    			t5 = text(".\n    The total weight is counted and then the size of actual content is measured\n    and shown as a ratio.");
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "For example: If a website has a total weight of 100kb and 60kb are the\n    documents structure, text, images, videos and so on, then the content ratio\n    is 60%. The rest are extras like CSS, JavaScript and so on. It is hard to\n    say what a good ratio is but my gut feeling is that everything above 20% is\n    pretty good already.";
    			t8 = space();
    			p3 = element("p");
    			strong = element("strong");
    			strong.textContent = "Disclaimer:";
    			t10 = text(" Currently, inline scripts and styles are\n    measured as content due to technical limitations of Phantomas. This will\n    hopefully be fixed soon.");
    			add_location(h1, file$1, 6, 4, 96);
    			add_location(header, file$1, 5, 2, 83);
    			add_location(p0, file$1, 8, 2, 137);
    			add_location(p1, file$1, 11, 2, 221);
    			add_location(p2, file$1, 17, 2, 469);
    			add_location(strong, file$1, 25, 4, 828);
    			add_location(p3, file$1, 24, 2, 820);
    			attr_dev(article, "id", "info-popup");
    			add_location(article, file$1, 4, 0, 55);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, header);
    			append_dev(header, h1);
    			append_dev(article, t1);
    			append_dev(article, p0);
    			append_dev(article, t3);
    			append_dev(article, p1);
    			append_dev(p1, t4);
    			mount_component(link, p1, null);
    			append_dev(p1, t5);
    			append_dev(article, t6);
    			append_dev(article, p2);
    			append_dev(article, t8);
    			append_dev(article, p3);
    			append_dev(p3, strong);
    			append_dev(p3, t10);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const link_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(link);
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
    	validate_slots("InfoPopup", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<InfoPopup> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Link });
    	return [];
    }

    class InfoPopup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InfoPopup",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    var data = [{url:"https://koehr.in",contentWeight:23078,extraWeight:66537,stamp:1606004545427},{url:"https://koehr.tech",contentWeight:4964,extraWeight:20108,stamp:1606004547391},{url:"https://sjmulder.nl",contentWeight:2361,extraWeight:0,stamp:1606004663706},{url:"http://cyberia.host",contentWeight:1191,extraWeight:0,stamp:1606004664417},{url:"https://text.npr.org",contentWeight:2760,extraWeight:0,stamp:1606004665037},{url:"https://playerone.kevincox.ca",contentWeight:1904,extraWeight:42661,stamp:1606004665881},{url:"https://dotfilehub.com",contentWeight:961,extraWeight:1281,stamp:1606004667422},{url:"https://manpages.bsd.lv",contentWeight:7045,extraWeight:1346,stamp:1606004669823},{url:"https://danluu.com",contentWeight:2895,extraWeight:0,stamp:1606004670441},{url:"https://gtf.io",contentWeight:2040,extraWeight:2752,stamp:1606004671103},{url:"http://minid.net",contentWeight:4110,extraWeight:0,stamp:1606004672171},{url:"https://250kb.club",contentWeight:1682,extraWeight:8330,stamp:1606070901151},{url:"https://subreply.com",contentWeight:6713,extraWeight:52472,stamp:1606070902296},{url:"https://seirdy.one",contentWeight:1554,extraWeight:1951,stamp:1606070903577},{url:"https://richj.co",contentWeight:2119,extraWeight:1840,stamp:1606070904708},{url:"https://mkws.sh/",contentWeight:75059,extraWeight:7051,stamp:1606070907275},{url:"https://porkbrain.com",contentWeight:89742,extraWeight:1941,stamp:1606070908242},{url:"https://pgjones.dev",contentWeight:15979,extraWeight:187928,stamp:1606070910182},{url:"https://jaime.gomezobregon.com",contentWeight:21100,extraWeight:71592,stamp:1606070911329},{url:"https://lawzava.com",contentWeight:2324,extraWeight:2267,stamp:1606070912369},{url:"https://www.cleanpython.com/",contentWeight:7781,extraWeight:126068,stamp:1606070914335},{url:"https://monokai.nl",contentWeight:4823,extraWeight:85479,stamp:1606070915137},{url:"https://flatpackapps.com",contentWeight:41219,extraWeight:1262,stamp:1606070917537},{url:"https://frontaid.io",contentWeight:59536,extraWeight:103859,stamp:1606070918722},{url:"https://worldti.me",contentWeight:3099,extraWeight:39571,stamp:1606070920657},{url:"https://sneak.berlin",contentWeight:187882,extraWeight:1257173,stamp:1606070922342},{url:"https://plumebio.com",contentWeight:1994,extraWeight:1598,stamp:1606070924010},{url:"https://jeremysarber.com",contentWeight:2522,extraWeight:0,stamp:1606070925135}];

    /* src/App.svelte generated by Svelte v3.29.7 */
    const file$2 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (44:6) {#each sortParameters as param}
    function create_each_block_1(ctx) {
    	let option;
    	let t0;
    	let t1_value = /*param*/ ctx[10] + "";
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text("content-");
    			t1 = text(t1_value);
    			option.__value = option_value_value = /*param*/ ctx[10];
    			option.value = option.__value;
    			add_location(option, file$2, 44, 6, 1132);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(44:6) {#each sortParameters as param}",
    		ctx
    	});

    	return block;
    }

    // (52:0) {#if showInfoPopup}
    function create_if_block(ctx) {
    	let infopopup;
    	let current;
    	infopopup = new InfoPopup({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(infopopup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(infopopup, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(infopopup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(infopopup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(infopopup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(52:0) {#if showInfoPopup}",
    		ctx
    	});

    	return block;
    }

    // (60:24) <Link href={page.url}>
    function create_default_slot$1(ctx) {
    	let t_value = stripped(/*page*/ ctx[7].url) + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sortedPages*/ 4 && t_value !== (t_value = stripped(/*page*/ ctx[7].url) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(60:24) <Link href={page.url}>",
    		ctx
    	});

    	return block;
    }

    // (57:2) {#each sortedPages as page}
    function create_each_block(ctx) {
    	let li;
    	let div0;
    	let span0;
    	let link;
    	let t0;
    	let span1;
    	let t1_value = /*page*/ ctx[7].size + "";
    	let t1;
    	let t2;
    	let t3;
    	let span2;
    	let t4_value = /*page*/ ctx[7].ratio + "";
    	let t4;
    	let t5;
    	let t6;
    	let div1;
    	let t7;
    	let div2;
    	let t8;
    	let li_style_value;
    	let current;

    	link = new Link({
    			props: {
    				href: /*page*/ ctx[7].url,
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			div0 = element("div");
    			span0 = element("span");
    			create_component(link.$$.fragment);
    			t0 = space();
    			span1 = element("span");
    			t1 = text(t1_value);
    			t2 = text("kb");
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = text("%");
    			t6 = space();
    			div1 = element("div");
    			t7 = space();
    			div2 = element("div");
    			t8 = space();
    			attr_dev(span0, "class", "url");
    			add_location(span0, file$2, 59, 6, 1499);
    			attr_dev(span1, "class", "size");
    			add_location(span1, file$2, 60, 6, 1580);
    			attr_dev(span2, "class", "ratio");
    			add_location(span2, file$2, 61, 6, 1626);
    			attr_dev(div0, "class", "entry");
    			add_location(div0, file$2, 58, 4, 1473);
    			attr_dev(div1, "class", "entry-size-bar");
    			toggle_class(div1, "highlighted", /*sortParam*/ ctx[0] === "size");
    			toggle_class(div1, "yellow", /*page*/ ctx[7].size > yellowSizeThreshhold);
    			toggle_class(div1, "red", /*page*/ ctx[7].size > redSizeThreshhold);
    			add_location(div1, file$2, 63, 4, 1682);
    			attr_dev(div2, "class", "entry-ratio-bar");
    			toggle_class(div2, "highlighted", /*sortParam*/ ctx[0] === "ratio");
    			toggle_class(div2, "yellow", /*page*/ ctx[7].ratio > yellowRatioThreshhold);
    			toggle_class(div2, "red", /*page*/ ctx[7].ratio > redRatioThreshhold);
    			add_location(div2, file$2, 69, 4, 1876);
    			attr_dev(li, "style", li_style_value = `--size:${/*page*/ ctx[7].size};--ratio:${/*page*/ ctx[7].ratio}%`);
    			add_location(li, file$2, 57, 2, 1411);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div0);
    			append_dev(div0, span0);
    			mount_component(link, span0, null);
    			append_dev(div0, t0);
    			append_dev(div0, span1);
    			append_dev(span1, t1);
    			append_dev(span1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, span2);
    			append_dev(span2, t4);
    			append_dev(span2, t5);
    			append_dev(li, t6);
    			append_dev(li, div1);
    			append_dev(li, t7);
    			append_dev(li, div2);
    			append_dev(li, t8);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const link_changes = {};
    			if (dirty & /*sortedPages*/ 4) link_changes.href = /*page*/ ctx[7].url;

    			if (dirty & /*$$scope, sortedPages*/ 8196) {
    				link_changes.$$scope = { dirty, ctx };
    			}

    			link.$set(link_changes);
    			if ((!current || dirty & /*sortedPages*/ 4) && t1_value !== (t1_value = /*page*/ ctx[7].size + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*sortedPages*/ 4) && t4_value !== (t4_value = /*page*/ ctx[7].ratio + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*sortParam*/ 1) {
    				toggle_class(div1, "highlighted", /*sortParam*/ ctx[0] === "size");
    			}

    			if (dirty & /*sortedPages, yellowSizeThreshhold*/ 4) {
    				toggle_class(div1, "yellow", /*page*/ ctx[7].size > yellowSizeThreshhold);
    			}

    			if (dirty & /*sortedPages, redSizeThreshhold*/ 4) {
    				toggle_class(div1, "red", /*page*/ ctx[7].size > redSizeThreshhold);
    			}

    			if (dirty & /*sortParam*/ 1) {
    				toggle_class(div2, "highlighted", /*sortParam*/ ctx[0] === "ratio");
    			}

    			if (dirty & /*sortedPages, yellowRatioThreshhold*/ 4) {
    				toggle_class(div2, "yellow", /*page*/ ctx[7].ratio > yellowRatioThreshhold);
    			}

    			if (dirty & /*sortedPages, redRatioThreshhold*/ 4) {
    				toggle_class(div2, "red", /*page*/ ctx[7].ratio > redRatioThreshhold);
    			}

    			if (!current || dirty & /*sortedPages*/ 4 && li_style_value !== (li_style_value = `--size:${/*page*/ ctx[7].size};--ratio:${/*page*/ ctx[7].ratio}%`)) {
    				attr_dev(li, "style", li_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(57:2) {#each sortedPages as page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let aside;
    	let div;
    	let t0;
    	let select;
    	let t1;
    	let button;
    	let t2_value = (/*showInfoPopup*/ ctx[1] ? "x" : "How does this work?") + "";
    	let t2;
    	let t3;
    	let t4;
    	let ol;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*sortParameters*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*showInfoPopup*/ ctx[1] && create_if_block(ctx);
    	let each_value = /*sortedPages*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div = element("div");
    			t0 = text("Sort by:\n    ");
    			select = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			button = element("button");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (/*sortParam*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[5].call(select));
    			add_location(select, file$2, 42, 4, 1056);
    			add_location(div, file$2, 40, 2, 1033);
    			attr_dev(button, "class", "info-toggle");
    			add_location(button, file$2, 48, 2, 1218);
    			add_location(aside, file$2, 39, 0, 1023);
    			add_location(ol, file$2, 55, 0, 1374);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div);
    			append_dev(div, t0);
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select, null);
    			}

    			select_option(select, /*sortParam*/ ctx[0]);
    			append_dev(aside, t1);
    			append_dev(aside, button);
    			append_dev(button, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[5]),
    					listen_dev(button, "click", /*toggleInfo*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sortParameters*/ 8) {
    				each_value_1 = /*sortParameters*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*sortParam, sortParameters*/ 9) {
    				select_option(select, /*sortParam*/ ctx[0]);
    			}

    			if ((!current || dirty & /*showInfoPopup*/ 2) && t2_value !== (t2_value = (/*showInfoPopup*/ ctx[1] ? "x" : "How does this work?") + "")) set_data_dev(t2, t2_value);

    			if (/*showInfoPopup*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*showInfoPopup*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t4.parentNode, t4);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*sortedPages, sortParam, yellowRatioThreshhold, redRatioThreshhold, yellowSizeThreshhold, redSizeThreshhold, stripped*/ 5) {
    				each_value = /*sortedPages*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ol, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t3);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(ol);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    const rejectThreshold = 256000;
    const yellowSizeThreshhold = 200;
    const redSizeThreshhold = 225;
    const yellowRatioThreshhold = 50;
    const redRatioThreshhold = 25;

    function stripped(url) {
    	return url.replaceAll(/(^https?:\/\/|\/$)/g, "");
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const pages = data.reduce(
    		(acc, page) => {
    			const totalWeight = page.contentWeight + page.extraWeight;
    			if (totalWeight > rejectThreshold) return acc;
    			const size = Math.round(totalWeight / 1024);
    			const ratio = Math.round(page.contentWeight * 100 / totalWeight);
    			acc.push({ url: page.url, size, ratio });
    			return acc;
    		},
    		[]
    	);

    	const sortParameters = ["size", "ratio"];
    	let sortParam = sortParameters[0];
    	let showInfoPopup = false;

    	function toggleInfo() {
    		$$invalidate(1, showInfoPopup = !showInfoPopup);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		sortParam = select_value(this);
    		$$invalidate(0, sortParam);
    		$$invalidate(3, sortParameters);
    	}

    	$$self.$capture_state = () => ({
    		InfoPopup,
    		Link,
    		data,
    		rejectThreshold,
    		yellowSizeThreshhold,
    		redSizeThreshhold,
    		yellowRatioThreshhold,
    		redRatioThreshhold,
    		pages,
    		sortParameters,
    		sortParam,
    		showInfoPopup,
    		stripped,
    		toggleInfo,
    		sortedPages
    	});

    	$$self.$inject_state = $$props => {
    		if ("sortParam" in $$props) $$invalidate(0, sortParam = $$props.sortParam);
    		if ("showInfoPopup" in $$props) $$invalidate(1, showInfoPopup = $$props.showInfoPopup);
    		if ("sortedPages" in $$props) $$invalidate(2, sortedPages = $$props.sortedPages);
    	};

    	let sortedPages;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*sortParam*/ 1) {
    			 $$invalidate(2, sortedPages = pages.sort((a, b) => {
    				return sortParam === "size"
    				? a.size - b.size
    				: b.ratio - a.ratio;
    			}));
    		}
    	};

    	return [
    		sortParam,
    		showInfoPopup,
    		sortedPages,
    		sortParameters,
    		toggleInfo,
    		select_change_handler
    	];
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

    var app = new App({ target: document.getElementById('members-table') });

    return app;

}());
//# sourceMappingURL=bundle.js.map
