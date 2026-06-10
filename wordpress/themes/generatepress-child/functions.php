<?php
/**
 * Pineda y Asociados Blog Child — Functions
 * GeneratePress Child Theme
 */

/* -------------------------------------------------------------------------- */
/* 1. THEME SETUP                                                              */
/* -------------------------------------------------------------------------- */

add_action('after_setup_theme', 'pyablog_setup');
function pyablog_setup() {
    // Soporte idiomas
    load_child_theme_textdomain('pineda-blog-child', get_stylesheet_directory() . '/languages');

    // Eliminar sidebar del blog (full-width)
    add_filter('generate_sidebar_layout', function($layout) {
        if (is_home() || is_category() || is_tag() || is_single() || is_search() || is_author()) {
            return 'no-sidebar';
        }
        return $layout;
    });

    // Desactivar elementos innecesarios de GeneratePress
    add_filter('generate_footer_widgets', '__return_false');
    add_filter('generate_show_title', '__return_false');
}

/* -------------------------------------------------------------------------- */
/* 2. ENQUEUE ASSETS                                                           */
/* -------------------------------------------------------------------------- */

add_action('wp_enqueue_scripts', 'pyablog_enqueue', 100);
function pyablog_enqueue() {
    $theme = wp_get_theme();
    $version = $theme->get('Version');

    // Parent theme styles
    wp_enqueue_style('generatepress-child', get_stylesheet_uri(), ['generatepress'], $version);

    // Blog CSS
    $css_path = get_stylesheet_directory_uri() . '/assets/css/blog.css';
    $css_file = get_stylesheet_directory() . '/assets/css/blog.css';
    wp_enqueue_style('pyablog-style', $css_path, ['generatepress-child'], file_exists($css_file) ? filemtime($css_file) : $version);

    // TOC JavaScript (only on single posts with reading time > 5 min)
    if (is_single()) {
        $reading_time = pyablog_reading_time(get_the_content());
        if ($reading_time >= 5) {
            $js_path = get_stylesheet_directory_uri() . '/assets/js/toc.js';
            wp_enqueue_script('pyablog-toc', $js_path, [], $version, true);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* 3. HELPERS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Calcula tiempo de lectura en minutos.
 */
function pyablog_reading_time($content = null) {
    if (!$content) {
        $content = get_the_content();
    }
    $word_count = str_word_count(wp_strip_all_tags($content));
    $minutes = max(1, ceil($word_count / 200));
    return $minutes;
}

/**
 * Muestra tiempo de lectura.
 */
function pyablog_reading_time_html($content = null) {
    $minutes = pyablog_reading_time($content);
    printf(
        '<span class="reading-time">⏱ %d %s</span>',
        $minutes,
        _n('min de lectura', 'min de lectura', $minutes, 'pineda-blog-child')
    );
}

/**
 * Obtiene categoría principal de un post (la primera asignada).
 */
function pyablog_primary_category($post_id = null) {
    if (!$post_id) $post_id = get_the_ID();
    $cats = get_the_category($post_id);
    return !empty($cats) ? $cats[0] : null;
}

/**
 * Badge de categoría con color.
 */
function pyablog_category_badge($post_id = null) {
    $cat = pyablog_primary_category($post_id);
    if (!$cat) return;
    $url = get_category_link($cat->term_id);
    echo '<span class="cat-badge"><a href="' . esc_url($url) . '">' . esc_html($cat->name) . '</a></span>';
}

/**
 * Teléfono del bufete (desde constantes wp-config o texto plano).
 */
function pyablog_phone() {
    return '+504 9536-3724';
}

function pyablog_whatsapp_url() {
    return 'https://wa.me/50495363724?text=Hola,%20necesito%20una%20consulta%20jur%C3%ADdica.';
}

/* -------------------------------------------------------------------------- */
/* 4. CONTENT FILTERS — inyección automática de bloques                       */
/* -------------------------------------------------------------------------- */

/**
 * Inyecta tabla de contenidos después del cover/header (manejado por JS).
 * Inyecta author box, CTA final y share bar al final del contenido.
 */

add_filter('the_content', 'pyablog_insert_author_box', 20);
function pyablog_insert_author_box($content) {
    if (!is_singular('post')) return $content;

    $author_id = get_the_author_meta('ID');
    $avatar = get_avatar($author_id, 64);
    $name = get_the_author();
    $bio = get_the_author_meta('description');
    $posts_url = get_author_posts_url($author_id);

    $box = '<section class="author-box">';
    $box .= '<div class="author-avatar">' . $avatar . '</div>';
    $box .= '<div class="author-info">';
    $box .= '<h4>' . esc_html($name) . '</h4>';
    $box .= '<p>' . esc_html($bio ?: 'Abogado en Pineda y Asociados.') . '</p>';
    $box .= '<a href="' . esc_url($posts_url) . '">Ver todos los artículos →</a>';
    $box .= '</div>';
    $box .= '</section>';

    return $content . $box;
}

add_filter('the_content', 'pyablog_insert_cta_final', 25);
function pyablog_insert_cta_final($content) {
    if (!is_singular('post')) return $content;

    $cta = '<section class="final-cta">';
    $cta .= '<h3>¿Necesita asesoría legal personalizada?</h3>';
    $cta .= '<p>Cada caso es único. Hable con un abogado y reciba orientación confidencial.</p>';
    $cta .= '<div class="cta-links">';
    $cta .= '<a href="tel:+50495363724" class="cta-link cta-link-tel">📞 ' . esc_html(pyablog_phone()) . '</a>';
    $cta .= '<a href="' . esc_url(pyablog_whatsapp_url()) . '" target="_blank" rel="noopener" class="cta-link cta-link-whatsapp">💬 WhatsApp</a>';
    $cta .= '<a href="/solicitar-consulta" class="cta-link cta-link-form">📝 Solicitar consulta</a>';
    $cta .= '</div>';
    $cta .= '</section>';

    return $content . $cta;
}

add_filter('the_content', 'pyablog_insert_share_bar', 30);
function pyablog_insert_share_bar($content) {
    if (!is_singular('post')) return $content;

    $url = urlencode(get_permalink());
    $title = urlencode(get_the_title());
    $share = '<div class="share-bar">';
    $share .= '<a href="https://twitter.com/intent/tweet?text=' . $title . '&url=' . $url . '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Twitter</a>';
    $share .= '<a href="https://www.linkedin.com/shareArticle?mini=true&url=' . $url . '&title=' . $title . '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg> LinkedIn</a>';
    $share .= '<a href="https://api.whatsapp.com/send?text=' . $title . '%20' . $url . '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp</a>';
    $share .= '<button onclick="navigator.clipboard.writeText(window.location.href);this.textContent=\'✅ Copiado\';setTimeout(()=>this.innerHTML=\'' . addslashes('<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg> Copiar enlace') . '\')">📋 Copiar enlace</button>';
    $share .= '</div>';

    return $content . $share;
}

/* -------------------------------------------------------------------------- */
/* 5. EXCERPT LENGTH                                                           */
/* -------------------------------------------------------------------------- */

add_filter('excerpt_length', function($length) { return 25; });
add_filter('excerpt_more', function() { return '...'; });

/* -------------------------------------------------------------------------- */
/* 6. READING TIME META — visible en listados                                  */
/* -------------------------------------------------------------------------- */

add_action('generate_after_entry_header', 'pyablog_display_reading_time');
function pyablog_display_reading_time() {
    if (is_single()) return;
    pyablog_reading_time_html();
}

/* -------------------------------------------------------------------------- */
/* 7. DISABLE ELEMENTS — TITLE, SIDEBAR EN BLOG                               */
/* -------------------------------------------------------------------------- */

add_action('wp_head', function() {
    if (is_home() || is_category() || is_tag() || is_single() || is_search() || is_author()) {
        remove_action('generate_after_entry_title', 'generate_post_meta');
    }
});

/* -------------------------------------------------------------------------- */
/* 8. REGISTER GUTENBERG BLOCKS                                                */
/* -------------------------------------------------------------------------- */

add_action('init', 'pyablog_register_blocks');
function pyablog_register_blocks() {
    // Registrar bloques desde /blocks/ si existieran como archivos PHP
    // Por ahora usamos inyección via the_content filter (más simple y mantenible)
    // Si se necesitan bloques Gutenberg nativos, registrar aquí con register_block_type
}

/* -------------------------------------------------------------------------- */
/* 9. RELATED POSTS QUERY                                                      */
/* -------------------------------------------------------------------------- */

function pyablog_get_related_posts($post_id = null, $count = 3) {
    if (!$post_id) $post_id = get_the_ID();
    $cats = wp_get_post_categories($post_id, ['fields' => 'ids']);
    if (empty($cats)) return [];

    $args = [
        'post_type'      => 'post',
        'posts_per_page' => $count,
        'post__not_in'   => [$post_id],
        'category__in'   => $cats,
        'orderby'        => 'rand',
    ];

    return get_posts($args);
}

/* -------------------------------------------------------------------------- */
/* 10. TAG NOINDEX LOGIC                                                       */
/* -------------------------------------------------------------------------- */

add_action('wp_head', 'pyablog_tag_noindex');
function pyablog_tag_noindex() {
    if (is_tag()) {
        $tag = get_queried_object();
        if ($tag && $tag->count <= 3) {
            echo '<meta name="robots" content="noindex, follow">' . "\n";
        }
    }
}

/* -------------------------------------------------------------------------- */
/* 11. BREADCRUMBS WRAPPER — usando Rank Math                                  */
/* -------------------------------------------------------------------------- */

function pyablog_breadcrumbs() {
    if (function_exists('rank_math_the_breadcrumbs')) {
        echo '<nav class="breadcrumbs" aria-label="Breadcrumb">';
        rank_math_the_breadcrumbs();
        echo '</nav>';
    }
}

/* -------------------------------------------------------------------------- */
/* 12. BLOG BODY CLASS                                                         */
/* -------------------------------------------------------------------------- */

add_filter('body_class', 'pyablog_body_class');
function pyablog_body_class($classes) {
    if (is_home() || is_category() || is_tag() || is_single() || is_search() || is_author()) {
        $classes[] = 'blog-layout-full';
    }
    return $classes;
}
